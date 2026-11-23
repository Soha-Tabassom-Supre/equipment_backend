import express from "express";

import {
  createReview,
  getEquipmentReviews,
  getLatestReviews,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();


router.get("/:equipmentId", getEquipmentReviews);
router.get("/", getLatestReviews);

router.post("/:equipmentId", verifyToken, authorize("customer"), createReview);

router.patch(
  "/edit/:reviewId",
  verifyToken,
  authorize("customer"),
  updateReview,
);

router.delete(
  "/edit/:reviewId",
  verifyToken,
  authorize("customer"),
  deleteReview,
);

export default router;
