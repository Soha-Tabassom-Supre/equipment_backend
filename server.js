
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { createIndexes } from "./config/indexes.js";
import authRoutes from "./routes/authRoutes.js";
import { verifyToken } from "./middleware/auth.js";
import { authorize } from "./middleware/authorize.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

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
