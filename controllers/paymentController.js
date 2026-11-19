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
  const stripe = getStripe()

  const signature = req.headers["stripe-signature"]

  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    console.error("Webhook signature verification failed:", error.message)

    return res.status(400).send("Invalid webhook signature.")
  }

  try {
   
    if (event.type === "checkout.session.completed") {
      const session = event.data.object

    
      if (session.payment_status !== "paid") {
        return res.status(200).json({ received: true })
      }

      const { bookingId, customerId } = session.metadata || {}

      if (!ObjectId.isValid(bookingId)) {
        return res.status(400).json({
          message: "Invalid booking ID in Stripe metadata."
        })
      }

      const db = req.app.locals.db

      const booking = await db.collection("bookings").findOne({
        _id: new ObjectId(bookingId),
        customerId,
        status: "confirmed"
      })

      if (!booking) {
        return res.status(404).json({
          message: "Matching confirmed booking not found."
        })
      }


      await db.collection("payments").updateOne(
        { stripeSessionId: session.id },
        {
          $setOnInsert: {
            bookingId: booking._id,
            customerId,
            stripeSessionId: session.id,
            amount: session.amount_total / 100,
            currency: session.currency,
            status: "paid",
            createdAt: new Date()
          }
        },
        { upsert: true }
      )

     
      await db.collection("bookings").updateOne(
        { _id: booking._id },
        {
          $set: {
            paymentStatus: "paid",
            paidAt: new Date(),
            updatedAt: new Date()
          }
        }
      )
    }

    return res.status(200).json({ received: true })

  } catch (error) {
    console.error("Stripe webhook processing error:", error)

    return res.status(500).json({
      message: "Webhook processing failed."
    })
  }
}
