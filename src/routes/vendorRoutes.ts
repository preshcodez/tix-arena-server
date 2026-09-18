import express from "express";

import {
  applyAsVendor,
  getVendorProfile,
  updateVendorProfile,
} from "../controllers/vendorController";

import { authMiddleware } from "../middlewares/authMiddleware";
import vendorMiddleware from "../middlewares/vendorMiddleware";

import upload from "../middlewares/upload";

const router = express.Router();

// ================= USER / VENDOR ROUTES =================

// User applies to become a vendor
router.post(
  "/apply",
  authMiddleware,
  upload.single("businessLogo"),
  applyAsVendor,
);

// ================= APPROVED VENDOR ROUTES =================

// Get vendor profile
router.get("/profile", authMiddleware, vendorMiddleware, getVendorProfile);

// Update vendor profile
router.patch(
  "/profile",
  authMiddleware,
  vendorMiddleware,
  upload.single("businessLogo"),
  updateVendorProfile,
);

export default router;
