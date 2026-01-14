import mongoose from "mongoose";
import { buffer } from "stream/consumers";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI env inside .env.local");
}

// TypeScript interface for our cached connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend NodeJS global to include mongoose cache
declare global {
  var mongoose: MongooseCache | undefined;
}

// Initialize cache
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

// Assign to global for hot reload in development
if (process.env.NODE_ENV === "development") {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  // If already connected, return cached connection
  if (cached.conn) {
    console.log("Using cached MongoDB connection");
    return cached.conn;
  }

  // If no promise, create new connection
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // max upto 10 socket connection
    };

    console.log("Creating new MongoDB connection...");

    cached.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        console.log("MongoDB connected successfully");
        return mongoose;
      })
      .catch((error) => {
        console.error("MongoDB connection error:", error);
        throw error;
      });
  }

  // Await the connection promise
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn!;
}

export default connectDB;
