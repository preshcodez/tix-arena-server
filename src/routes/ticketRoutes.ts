import { Router } from "express";

import { authMiddleware } from "../middlewares/authMiddleware";
import vendorMiddleware from "../middlewares/vendorMiddleware";

import {
  bookTicket,
  getMyTickets,
  hideMyTicket,
  checkInTicket,
  initializePayment,
  verifyPayment,
  getEventTickets,
  getEventTicketStatistics,
} from "../controllers/ticketController";

const router = Router();

// =====================================================
// USER TICKET ROUTES
// =====================================================

// Book ticket
router.post("/book", authMiddleware, bookTicket);

// Get logged-in user's tickets
router.get("/my-tickets", authMiddleware, getMyTickets);

// Remove ticket from My Tickets
router.patch("/:ticketId/hide", authMiddleware, hideMyTicket);

// Check in ticket
router.post("/check-in", authMiddleware, checkInTicket);

// =====================================================
// VENDOR EVENT TICKET ROUTES
// =====================================================

// Get all tickets/attendees for a vendor's event
router.get(
  "/event/:eventId",
  authMiddleware,
  vendorMiddleware,
  getEventTickets,
);

// Get ticket statistics for a vendor's event
router.get(
  "/event/:eventId/statistics",
  authMiddleware,
  vendorMiddleware,
  getEventTicketStatistics,
);

// =====================================================
// PAYSTACK PAYMENT
// =====================================================

// Initialize payment
router.post("/:ticketId/pay", authMiddleware, initializePayment);

// Verify payment
router.post("/:ticketId/verify", authMiddleware, verifyPayment);

export default router;
