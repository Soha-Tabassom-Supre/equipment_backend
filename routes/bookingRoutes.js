import express from "express";

import {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  acceptBooking,
  rejectBooking,
  cancelBooking,
} from "../controllers/bookingController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();


router.post("/", verifyToken, authorize("customer"), createBooking);
router.get("/my-bookings", verifyToken, authorize("customer"), getMyBookings);
router.get(
  "/owner-requests",
  verifyToken,
  authorize("owner"),
  getOwnerBookings,
);


router.patch("/:id/accept", verifyToken, authorize("owner"), acceptBooking)

router.patch("/:id/reject", verifyToken, authorize("owner"), rejectBooking)

router.patch("/:id/cancel", verifyToken, authorize("customer"), cancelBooking);
export default router;
