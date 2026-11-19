import express from "express";

import {
  getPendingEquipment,
  approveEquipment,
  rejectEquipment,
  getAllUsers,
  searchUsers,
  updateUserRole,
  toggleUserStatus,
} from "../controllers/adminController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();


router.use(verifyToken, authorize("admin"));

router.get("/pending-equipment", getPendingEquipment);


router.patch("/equipment/:id/approve", approveEquipment);

router.patch("/equipment/:id/reject", rejectEquipment);
router.get("/users", getAllUsers);
router.get("/users/search", searchUsers);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", toggleUserStatus);

export default router;
