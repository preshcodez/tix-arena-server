import express from "express";
import * as adminController from "../controllers/adminController";

import { authMiddleware } from "../middlewares/authMiddleware";
import { adminAuth } from "../middlewares/adminMiddleware";

const router = express.Router();

// ==============================
// ADMIN AUTHENTICATION
// ==============================

router.use(authMiddleware);
router.use(adminAuth);

// ==============================
// ADMIN DASHBOARD
// ==============================

router.get("/dashboard", adminController.getDashboardStats);

// ==============================
// VENDOR MANAGEMENT
// ==============================

router.get("/vendors", adminController.getAllVendors);

router.get("/vendors/pending", adminController.getPendingVendors);

router.patch("/vendors/:vendorId/approve", adminController.approveVendor);

router.patch("/vendors/:vendorId/reject", adminController.rejectVendor);

// ==============================
// EVENT MANAGEMENT
// ==============================

router.patch("/events/:eventId/approve", adminController.approveEvent);

router.patch("/events/:eventId/reject", adminController.rejectEvent);

export default router;
