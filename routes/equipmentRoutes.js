import express from "express";

import {
  addEquipment,
  getAllEquipment,
  getEquipmentById,
  getMyEquipment,
  getMyEquipmentById,
  updateEquipment,
  deleteEquipment,
} from "../controllers/equipmentController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();


router.get("/", getAllEquipment);


router.get("/my-equipment", verifyToken, authorize("owner"), getMyEquipment);

router.get(
  "/my-equipment/:id",
  verifyToken,
  authorize("owner"),
  getMyEquipmentById,
);

router.get("/:id", getEquipmentById);


router.post("/", verifyToken, authorize("owner"), addEquipment);


router.patch("/:id", verifyToken, authorize("owner"), updateEquipment);


router.delete("/:id", verifyToken, authorize("owner"), deleteEquipment);



export default router;
