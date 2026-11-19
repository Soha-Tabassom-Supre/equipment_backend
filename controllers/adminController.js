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
