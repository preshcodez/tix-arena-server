import express from "express";

import {
  createEvent,
  getAllEvents,
  getSingleEvent,
  updateEvent,
  deleteEvent,
  getVendorEvents,
  closeEvent,
} from "../controllers/eventController";

import { authMiddleware } from "../middlewares/authMiddleware";
import vendorMiddleware from "../middlewares/vendorMiddleware";
import upload from "../middlewares/upload";

const router = express.Router();

// ================= PUBLIC EVENT ROUTES =================

// Create event
router.post(
  "/",
  authMiddleware,
  vendorMiddleware,
  upload.single("image"),
  createEvent,
);

// Get all approved public events
router.get("/", getAllEvents);

// ================= VENDOR EVENT ROUTES =================

// Get logged-in vendor's events
router.get("/vendor/me", authMiddleware, vendorMiddleware, getVendorEvents);

// Get vendor events by vendor ID
router.get(
  "/vendor/:vendorId",
  authMiddleware,
  vendorMiddleware,
  getVendorEvents,
);

// Get single event
router.get("/:id", getSingleEvent);

// Update event
router.patch(
  "/:id",
  authMiddleware,
  vendorMiddleware,
  upload.single("image"),
  updateEvent,
);

// Delete event
router.delete("/:id", authMiddleware, vendorMiddleware, deleteEvent);

// Close event
router.patch("/:id/close", authMiddleware, vendorMiddleware, closeEvent);

export default router;
