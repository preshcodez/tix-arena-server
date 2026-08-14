import dns from "dns";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

import User from "../models/userModel";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const createAdmin = async () => {
  try {
    // ==============================
    // CHECK ENV VARIABLES
    // ==============================

    const mongoUri = process.env.MONGO_URI;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!mongoUri) {
      throw new Error("MONGO_URI is not configured");
    }

    if (!adminEmail) {
      throw new Error("ADMIN_EMAIL is not configured");
    }

    if (!adminPassword) {
      throw new Error("ADMIN_PASSWORD is not configured");
    }

    // ==============================
    // CONNECT TO MONGODB
    // ==============================

    await mongoose.connect(mongoUri);

    console.log("Connected to MongoDB");

    // ==============================
    // CHECK IF EMAIL ALREADY EXISTS
    // ==============================

    const existingUser = await User.findOne({
      email: adminEmail,
    });

    if (existingUser) {
      console.log(`A user with the email ${adminEmail} already exists.`);

      await mongoose.disconnect();
      return;
    }

    // ==============================
    // HASH ADMIN PASSWORD
    // ==============================

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // ==============================
    // CREATE ADMIN ACCOUNT
    // ==============================

    const admin = await User.create({
      firstName: "Tix",
      lastName: "Admin",
      email: adminEmail,
      passwordHash,
      role: "admin",
      isVerified: true,
    });

    // ==============================
    // SUCCESS
    // ==============================

    console.log("=================================");
    console.log("ADMIN ACCOUNT CREATED");
    console.log("=================================");
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);
    console.log("=================================");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Failed to create admin:", error);

    await mongoose.disconnect();
    process.exit(1);
  }
};

createAdmin();
