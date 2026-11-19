import { ObjectId } from "mongodb";


export async function createBooking(req, res) {
  try {
    const { equipmentId, startDate, endDate } = req.body;


    if (!equipmentId || !startDate || !endDate) {
      return res.status(400).json({
        message: "Equipment ID, start date and end date are required.",
      });
    }

   
    if (!ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        message: "Invalid equipment ID.",
      });
    }

    
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(startDate) || !datePattern.test(endDate)) {
      return res.status(400).json({
        message: "Dates must use YYYY-MM-DD format.",
      });
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T00:00:00.000Z`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start.toISOString().slice(0, 10) !== startDate ||
      end.toISOString().slice(0, 10) !== endDate
    ) {
      return res.status(400).json({
        message: "Invalid rental dates.",
      });
    }

    
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({
        message: "Rental start date cannot be in the past.",
      });
    }


    if (end <= start) {
      return res.status(400).json({
        message: "End date must be after start date.",
      });
    }

    const db = req.app.locals.db;

   
    const equipment = await db.collection("equipment").findOne({
      _id: new ObjectId(equipmentId),
      status: "approved",
    });

    if (!equipment) {
      return res.status(404).json({
        message: "Approved equipment not found.",
      });
    }


    if (equipment.ownerId === req.user.userId) {
      return res.status(403).json({
        message: "You cannot rent your own equipment.",
      });
    }


    const rentalDays = (end - start) / (1000 * 60 * 60 * 24);
    const totalAmount = rentalDays * equipment.pricePerDay;

   
    const newBooking = {
      customerId: req.user.userId,
      ownerId: equipment.ownerId,
      equipmentId: equipment._id,
      equipmentName: equipment.name,
      pricePerDay: equipment.pricePerDay,
      startDate,
      endDate,
      rentalDays,
      totalAmount,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("bookings").insertOne(newBooking);

    return res.status(201).json({
      message: "Booking request submitted successfully!",
      bookingId: result.insertedId,
      booking: newBooking,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}


export async function getMyBookings(req, res) {
  try {
    const db = req.app.locals.db;

    const bookings = await db
      .collection("bookings")
      .find({ customerId: req.user.userId })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get customer bookings error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}



export async function getOwnerBookings(req, res) {
  try {
    const db = req.app.locals.db

    const bookings = await db.collection("bookings")
      .find({ ownerId: req.user.userId })
      .sort({ createdAt: -1 })
      .toArray()

    return res.status(200).json({
      count: bookings.length,
      bookings
    })

  } catch (error) {
    console.error("Get owner bookings error:", error)

    return res.status(500).json({
      message: "Internal server error."
    })
  }
}



export async function acceptBooking(req, res) {
  try {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid booking ID."
      })
    }

    const db = req.app.locals.db

    const result = await db.collection("bookings").updateOne(
      {
        _id: new ObjectId(id),
        ownerId: req.user.userId,
        status: "pending"
      },
      {
        $set: {
          status: "confirmed",
          confirmedAt: new Date(),
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Pending booking not found or you are not its owner."
      })
    }

    return res.status(200).json({
      message: "Booking accepted successfully."
    })

  } catch (error) {
    console.error("Accept booking error:", error)

    return res.status(500).json({
      message: "Internal server error."
    })
  }
}


export async function rejectBooking(req, res) {
  try {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid booking ID."
      })
    }

    const db = req.app.locals.db

    const result = await db.collection("bookings").updateOne(
      {
        _id: new ObjectId(id),
        ownerId: req.user.userId,
        status: "pending"
      },
      {
        $set: {
          status: "rejected",
          rejectedAt: new Date(),
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Pending booking not found or you are not its owner."
      })
    }

    return res.status(200).json({
      message: "Booking rejected successfully."
    })

  } catch (error) {
    console.error("Reject booking error:", error)

    return res.status(500).json({
      message: "Internal server error."
    })
  }
}


export async function cancelBooking(req, res) {
  try {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid booking ID."
      })
    }

    const db = req.app.locals.db

    const result = await db.collection("bookings").updateOne(
      {
        _id: new ObjectId(id),
        customerId: req.user.userId,
        status: "pending"
      },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Pending booking not found or you are not its customer."
      })
    }

    return res.status(200).json({
      message: "Booking cancelled successfully."
    })

  } catch (error) {
    console.error("Cancel booking error:", error)

    return res.status(500).json({
      message: "Internal server error."
    })
  }
}
