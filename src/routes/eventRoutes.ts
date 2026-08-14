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
import { vendorMiddleware } from "../middlewares/vendorMiddleware";
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


// Get all events
router.get("/", getAllEvents);

// Get vendor events
router.get(
  "/vendor/:vendorId",
  authMiddleware,
  vendorMiddleware,
  getVendorEvents,
);

// Get single event
router.get("/:id", getSingleEvent);

// ================= VENDOR ROUTES =================





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
