import express from "express";

import { applyAsVendor } from "../controllers/vendorController";

import { authMiddleware } from "../middlewares/authMiddleware";
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

export default router;
