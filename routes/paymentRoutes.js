import express from "express";

import { createCheckoutSession } from "../controllers/paymentController.js";
import { verifyToken } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.post(
  "/create-checkout-session",
  verifyToken,
  authorize("customer"),
  createCheckoutSession,
);

export default router;
