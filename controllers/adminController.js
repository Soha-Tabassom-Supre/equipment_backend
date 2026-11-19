import { ObjectId } from "mongodb";


export async function getPendingEquipment(req, res) {
  try {
    const db = req.app.locals.db;

    const equipment = await db
      .collection("equipment")
      .find({ status: "pending" })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      count: equipment.length,
      equipment,
    });
  } catch (error) {
    console.error("Get pending equipment error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}


export async function approveEquipment(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid equipment ID.",
      });
    }

    const db = req.app.locals.db;

    const result = await db.collection("equipment").updateOne(
      {
        _id: new ObjectId(id),
        status: "pending",
      },
      {
        $set: {
          status: "approved",
          approvedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Pending equipment not found.",
      });
    }

    return res.status(200).json({
      message: "Equipment approved successfully.",
    });
  } catch (error) {
    console.error("Approve equipment error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}


export async function rejectEquipment(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid equipment ID.",
      });
    }

    if (typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({
        message: "Please provide a rejection reason.",
      });
    }

    const db = req.app.locals.db;

    const result = await db.collection("equipment").updateOne(
      {
        _id: new ObjectId(id),
        status: "pending",
      },
      {
        $set: {
          status: "rejected",
          rejectionReason: reason.trim(),
          rejectedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Pending equipment not found.",
      });
    }

    return res.status(200).json({
      message: "Equipment rejected successfully.",
    });
  } catch (error) {
    console.error("Reject equipment error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}



export async function getAllUsers(req, res) {
  try {
    const db = req.app.locals.db;

    const users = await db
      .collection("users")
      .find(
        {},
        {
          projection: {
            password: 0,
          },
        },
      )
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      totalUsers: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}

export async function searchUsers(req, res) {
  try {
    const { search = "" } = req.query;

    const db = req.app.locals.db;

    const users = await db
      .collection("users")
      .find(
        {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        },
        {
          projection: { password: 0 },
        },
      )
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      totalUsers: users.length,
      users,
    });
  } catch (error) {
    console.error("Search users error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}


export async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    if (!["customer", "owner"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role.",
      });
    }

  
    if (id === req.user.userId) {
      return res.status(403).json({
        message: "You cannot change your own role.",
      });
    }

    const db = req.app.locals.db;

    const result = await db.collection("users").updateOne(
      {
        _id: new ObjectId(id),
        role: { $ne: "admin" },
      },
      {
        $set: {
          role,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "User not found or cannot change admin role.",
      });
    }

    return res.status(200).json({
      message: "User role updated successfully.",
    });
  } catch (error) {
    console.error("Update user role error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}




export async function toggleUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    if (typeof isBlocked !== "boolean") {
      return res.status(400).json({
        message: "isBlocked must be true or false.",
      });
    }

    const db = req.app.locals.db;

   const result = await db.collection("users").updateOne(
     {
       _id: {
         $eq: new ObjectId(id),
         $ne: new ObjectId(req.user.userId),
       },
       role: { $ne: "admin" },
     },
     {
       $set: {
         isBlocked,
         updatedAt: new Date(),
       },
     },
   );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "User not found or cannot be blocked.",
      });
    }

    return res.status(200).json({
      message: isBlocked
        ? "User blocked successfully."
        : "User unblocked successfully.",
    });
  } catch (error) {
    console.error("Toggle user status error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}



export async function getAllBookings(req, res) {
  try {
    const db = req.app.locals.db;

    const bookings = await db
      .collection("bookings")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      totalBookings: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get all bookings error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}



export async function filterBookings(req, res) {
  try {
    const { status } = req.query;

    const allowedStatuses = ["pending", "confirmed", "rejected", "cancelled"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Please provide a valid booking status.",
      });
    }

    const db = req.app.locals.db;

    const bookings = await db
      .collection("bookings")
      .find({ status })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      totalBookings: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Filter bookings error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}



export async function cancelBookingByAdmin(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid booking ID.",
      });
    }

    const db = req.app.locals.db;

    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(id),
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(409).json({
        message: "Paid bookings require a Stripe refund before cancellation.",
      });
    }

    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({
        message: "This booking cannot be cancelled.",
      });
    }

    await db.collection("bookings").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
          cancelledBy: req.user.userId,
          updatedAt: new Date(),
        },
      },
    );

    return res.status(200).json({
      message: "Booking cancelled successfully.",
    });
  } catch (error) {
    console.error("Admin booking cancellation error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}
