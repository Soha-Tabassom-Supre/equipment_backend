export async function getOwnerAnalytics(req, res) {
  try {
    const db = req.app.locals.db;
    const ownerId = req.user.userId;

    const [
      totalEquipment,
      approvedEquipment,
      pendingEquipment,
      totalBookings,
      pendingRequests,
      confirmedBookings,
      earningsResult,
    ] = await Promise.all([
      db.collection("equipment").countDocuments({ ownerId }),

      db.collection("equipment").countDocuments({
        ownerId,
        status: "approved",
      }),

      db.collection("equipment").countDocuments({
        ownerId,
        status: "pending",
      }),

      db.collection("bookings").countDocuments({ ownerId }),

      db.collection("bookings").countDocuments({
        ownerId,
        status: "pending",
      }),

      db.collection("bookings").countDocuments({
        ownerId,
        status: "confirmed",
      }),

      db
        .collection("bookings")
        .aggregate([
          {
            $match: {
              ownerId,
              paymentStatus: "paid",
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$totalAmount" },
            },
          },
        ])
        .toArray(),
    ]);

    const totalEarnings = earningsResult[0]?.total || 0;

    return res.status(200).json({
      analytics: {
        totalEquipment,
        approvedEquipment,
        pendingEquipment,
        totalBookings,
        pendingRequests,
        confirmedBookings,
        totalEarnings,
      },
    });
  } catch (error) {
    console.error("Owner analytics error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}
