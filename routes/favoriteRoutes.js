import express from "express";

import {
  addFavorite,
  getMyFavorites,
  removeFavorite,
} from "../controllers/favoriteController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();


router.use(verifyToken, authorize("customer"));


router.get("/", getMyFavorites);


router.post("/:equipmentId", addFavorite);

router.delete("/:equipmentId", removeFavorite);

export default router;
