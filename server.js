
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { createIndexes } from "./config/indexes.js";
import authRoutes from "./routes/authRoutes.js";
import { verifyToken } from "./middleware/auth.js";
import { authorize } from "./middleware/authorize.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { handleStripeWebhook } from "./controllers/paymentController.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/owner", ownerRoutes);

app.get("/", (req, res) => {
  res.send("Equipment Rental Server is Running!");
});


app.get("/api/protected", verifyToken, (req, res) => {
  res.json({
    message: "You accessed a protected route!",
    user: req.user,
  });
});

app.get("/api/admin-test", verifyToken, authorize("admin"), (req, res) => {
  res.json({
    message: "Welcome, Admin!",
  });
});

async function startServer() {
  try {
    const db = await connectDB(process.env.MONGODB_URI);

    app.locals.db = db;

    await createIndexes(db);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
