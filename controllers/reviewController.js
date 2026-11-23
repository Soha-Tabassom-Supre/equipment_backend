import { ObjectId } from "mongodb";

const MAX_COMMENT_LENGTH = 1000;

export async function createReview(req, res) {
  try {
    const { equipmentId } = req.params;
    const { rating, comment } = req.body;

    if (!ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        message: "Invalid equipment ID.",
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be an integer between 1 and 5.",
      });
    }

    if (typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({
        message: "Please provide a review comment.",
      });
    }

    if (comment.trim().length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({
        message: "Review comment cannot exceed 1000 characters.",
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

    const existingReview = await db.collection("reviews").findOne({
      customerId: req.user.userId,
      equipmentId: new ObjectId(equipmentId),
    });

    if (existingReview) {
      return res.status(409).json({
        message: "You have already reviewed this equipment.",
      });
    }

    const customer = await db.collection("users").findOne({
      _id: new ObjectId(req.user.userId),
    });

    const newReview = {
      equipmentId: new ObjectId(equipmentId),
      customerId: req.user.userId,
      customerName: customer?.name || "Customer",
      rating,
      comment: comment.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("reviews").insertOne(newReview);

    return res.status(201).json({
      message: "Review submitted successfully.",
      reviewId: result.insertedId,
    });
  } catch (error) {
    console.error("Create review error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}

export async function getEquipmentReviews(req, res) {
  try {
    const { equipmentId } = req.params;

    if (!ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        message: "Invalid equipment ID.",
      });
    }

    const db = req.app.locals.db;

    const reviews = await db
      .collection("reviews")
      .find({
        equipmentId: new ObjectId(equipmentId),
      })
      .sort({ createdAt: -1 })
      .toArray();

    const totalReviews = reviews.length;

    const averageRating = totalReviews
      ? Number(
          (
            reviews.reduce((sum, review) => sum + review.rating, 0) /
            totalReviews
          ).toFixed(1),
        )
      : 0;

    return res.status(200).json({
      totalReviews,
      averageRating,
      reviews,
    });
  } catch (error) {
    console.error("Get reviews error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}

export async function updateReview(req, res) {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        message: "Invalid review ID.",
      });
    }

    if (
      rating !== undefined &&
      (!Number.isInteger(rating) || rating < 1 || rating > 5)
    ) {
      return res.status(400).json({
        message: "Rating must be an integer between 1 and 5.",
      });
    }

    if (
      comment !== undefined &&
      (typeof comment !== "string" || !comment.trim())
    ) {
      return res.status(400).json({
        message: "Review comment cannot be empty.",
      });
    }

    if (comment !== undefined && comment.trim().length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({
        message: "Review comment cannot exceed 1000 characters.",
      });
    }

    const updates = {};

    if (rating !== undefined) updates.rating = rating;
    if (comment !== undefined) updates.comment = comment.trim();

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Provide a rating or comment to update.",
      });
    }

    updates.updatedAt = new Date();

    const db = req.app.locals.db;

    const result = await db.collection("reviews").updateOne(
      {
        _id: new ObjectId(reviewId),
        customerId: req.user.userId,
      },
      {
        $set: updates,
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Review not found or you are not its owner.",
      });
    }

    return res.status(200).json({
      message: "Review updated successfully.",
    });
  } catch (error) {
    console.error("Update review error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}

export async function deleteReview(req, res) {
  try {
    const { reviewId } = req.params;

    if (!ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        message: "Invalid review ID.",
      });
    }

    const db = req.app.locals.db;

    const result = await db.collection("reviews").deleteOne({
      _id: new ObjectId(reviewId),
      customerId: req.user.userId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Review not found or you are not its owner.",
      });
    }

    return res.status(200).json({
      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error("Delete review error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}


export async function getLatestReviews(req, res) {
  try {
    const db = req.app.locals.db;

    const reviews = await db
      .collection("reviews")
      .find({})
      .sort({ createdAt: -1 })
      .limit(4)
      .project({
        customerName: 1,
        rating: 1,
        comment: 1,
        createdAt: 1,
      })
      .toArray();

    return res.status(200).json({
      totalReviews: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Get latest reviews error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}

