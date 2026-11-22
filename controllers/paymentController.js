import { ObjectId } from "mongodb";
import { getStripe } from "../config/stripe.js";

export async function createCheckoutSession(req, res) {
  try {
    const { bookingId } = req.body;

    if (!bookingId || !ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        message: "Valid booking ID is required.",
      });
    }

    const db = req.app.locals.db;

    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(bookingId),
      customerId: req.user.userId,
      status: "confirmed",
    });

    if (!booking) {
      return res.status(404).json({
        message: "Confirmed booking not found.",
      });
    }

    const existingPayment = await db.collection("payments").findOne({
      bookingId: booking._id,
      status: "paid",
    });

    if (existingPayment) {
      return res.status(409).json({
        message: "This booking has already been paid.",
      });
    }

    const stripe = getStripe();
    const amountInPaisa = Math.round(booking.totalAmount * 100);

    if (!Number.isSafeInteger(amountInPaisa) || amountInPaisa <= 0) {
      return res.status(400).json({
        message: "Invalid booking amount.",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: booking.equipmentName,
            },
            unit_amount: amountInPaisa,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: booking._id.toString(),
        customerId: req.user.userId,
      },
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
    });

    return res.status(200).json({
      message: "Checkout session created.",
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("Create checkout session error:", error);

    return res.status(500).json({
      message: "Unable to create checkout session.",
    });
  }
}

export async function handleStripeWebhook(req, res) {
  try {
    console.log("\n========== STRIPE WEBHOOK RECEIVED ==========");

    console.log("REQUEST BODY IS BUFFER:", Buffer.isBuffer(req.body));
    console.log("SIGNATURE EXISTS:", Boolean(req.headers["stripe-signature"]));
    console.log(
      "WEBHOOK SECRET EXISTS:",
      Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    );

    const stripe = getStripe();
    const signature = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error.message);
      return res.status(400).send("Invalid webhook signature.");
    }

    console.log("EVENT TYPE:", event.type);

    if (event.data?.object) {
      console.log("SESSION ID:", event.data.object.id);
      console.log("PAYMENT STATUS:", event.data.object.payment_status);
      console.log("SESSION MODE:", event.data.object.mode);
      console.log("SESSION METADATA:", event.data.object.metadata);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      if (session.payment_status !== "paid") {
        console.log("Payment is not marked paid by Stripe.");
        return res.status(200).json({ received: true });
      }

      if (
        session.mode !== "payment" ||
        session.currency !== "bdt" ||
        !Number.isSafeInteger(session.amount_total) ||
        session.amount_total <= 0 ||
        !session.id
      ) {
        console.error("Invalid Stripe checkout session:", session.id);

        return res.status(400).json({
          message: "Invalid payment session details.",
        });
      }

      const { bookingId, customerId } = session.metadata || {};

      if (!bookingId || !ObjectId.isValid(bookingId) || !customerId) {
        console.error("Invalid booking metadata:", session.metadata);

        return res.status(400).json({
          message: "Invalid booking information in Stripe metadata.",
        });
      }

      const db = req.app.locals.db;

      console.log("DATABASE AVAILABLE:", Boolean(db));

      const booking = await db.collection("bookings").findOne({
        _id: new ObjectId(bookingId),
        customerId,
        status: "confirmed",
      });

      if (!booking) {
        console.error("Matching confirmed booking not found:", {
          bookingId,
          customerId,
        });

        return res.status(404).json({
          message: "Matching confirmed booking not found.",
        });
      }

      console.log("BOOKING FOUND:", booking._id.toString());
      console.log("BOOKING TOTAL:", booking.totalAmount);

      const expectedAmountInPaisa = Math.round(booking.totalAmount * 100);

      if (
        !Number.isSafeInteger(expectedAmountInPaisa) ||
        expectedAmountInPaisa <= 0 ||
        session.amount_total !== expectedAmountInPaisa
      ) {
        console.error("Stripe payment amount mismatch:", {
          stripeAmount: session.amount_total,
          expectedAmount: expectedAmountInPaisa,
        });

        return res.status(400).json({
          message: "Payment amount does not match booking.",
        });
      }

      const paymentResult = await db.collection("payments").updateOne(
        { stripeSessionId: session.id },
        {
          $setOnInsert: {
            bookingId: booking._id,
            customerId,
            stripeSessionId: session.id,
            amount: session.amount_total / 100,
            currency: session.currency,
            status: "paid",
            createdAt: new Date(),
          },
        },
        { upsert: true },
      );



      const bookingResult = await db.collection("bookings").updateOne(
        { _id: booking._id },
        {
          $set: {
            paymentStatus: "paid",
            paidAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );

     
    }

  

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);

    return res.status(500).json({
      message: "Webhook processing failed.",
    });
  }
}
