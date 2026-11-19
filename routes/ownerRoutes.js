import express from "express";
import { getOwnerAnalytics } from "../controllers/ownerController.js";
import { verifyToken } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(verifyToken, authorize("owner"));

router.get("/analytics", getOwnerAnalytics);

export default router;
