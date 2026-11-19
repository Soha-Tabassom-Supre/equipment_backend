import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URI);

async function connectDB() {
  try {
    await client.connect();

    console.log("MongoDB Connected Successfully!");

    const db = client.db("equipment_rental");

    return db;
  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
    process.exit(1);
  }
}

app.get("/", (req, res) => {
  res.send("Equipment Rental Server is Running!");
});

async function startServer() {
  const db = await connectDB();

  app.locals.db = db;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
