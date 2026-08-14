import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8","8.8.4.4"])

export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    await mongoose.connect(uri);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
