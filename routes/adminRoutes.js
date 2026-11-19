import express from "express";

import {
  getPendingEquipment,
  approveEquipment,
  rejectEquipment,
} from "../controllers/adminController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();


router.use(verifyToken, authorize("admin"));

router.get("/pending-equipment", getPendingEquipment);


router.patch("/equipment/:id/approve", approveEquipment);

router.patch("/equipment/:id/reject", rejectEquipment);

export default router;
