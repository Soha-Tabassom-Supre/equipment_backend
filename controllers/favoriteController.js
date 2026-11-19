import { ObjectId } from "mongodb";

export async function addFavorite(req, res) {
  try {
    const { equipmentId } = req.params;

    if (!ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        message: "Invalid equipment ID.",
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

    const existingFavorite = await db.collection("favorites").findOne({
      customerId: req.user.userId,
      equipmentId: new ObjectId(equipmentId),
    });

    if (existingFavorite) {
      return res.status(409).json({
        message: "Equipment is already in your favorites.",
      });
    }

    await db.collection("favorites").insertOne({
      customerId: req.user.userId,
      equipmentId: new ObjectId(equipmentId),
      createdAt: new Date(),
    });

    return res.status(201).json({
      message: "Equipment added to favorites.",
    });
  } catch (error) {
    console.error("Add favorite error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Equipment is already in your favorites.",
      });
    }

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}


export async function getMyFavorites(req, res) {
  try {
    const db = req.app.locals.db;

    const favorites = await db
      .collection("favorites")
      .find({
        customerId: req.user.userId,
      })
      .sort({ createdAt: -1 })
      .toArray();

    const equipmentIds = favorites.map((item) => item.equipmentId);

    const equipment = await db
      .collection("equipment")
      .find({
        _id: { $in: equipmentIds },
        status: "approved",
      })
      .toArray();

    return res.status(200).json({
      count: equipment.length,
      equipment,
    });
  } catch (error) {
    console.error("Get favorites error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}

export async function removeFavorite(req, res) {
  try {
    const { equipmentId } = req.params;

    if (!ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        message: "Invalid equipment ID.",
      });
    }

    const db = req.app.locals.db;

    const result = await db.collection("favorites").deleteOne({
      customerId: req.user.userId,
      equipmentId: new ObjectId(equipmentId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Favorite equipment not found.",
      });
    }

    return res.status(200).json({
      message: "Equipment removed from favorites.",
    });
  } catch (error) {
    console.error("Remove favorite error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}
