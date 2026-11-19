import { MongoClient } from "mongodb";

export async function connectDB(uri) {
  try {
    const client = new MongoClient(uri);

    await client.connect();

    console.log("MongoDB Connected Successfully!");

    const db = client.db("equipment_rental");

    return db;
  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
    throw error;
  }
}
