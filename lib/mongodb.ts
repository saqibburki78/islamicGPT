import { MongoClient } from "mongodb";
const URL = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = "lillith";
const Client = new MongoClient(URL);
export async function ConnectToMongoDB() {
  try {
    const connection = await Client.connect();
    console.log("Connected to MongoDB");
    const db = connection.db(DB_NAME);
    const collection = db.collection("conversations");
    console.log("Collection created");
    return db;
  } catch (error: any) {
    console.error("Error connecting to MongoDB:", error.message);
    throw error;
  }
}