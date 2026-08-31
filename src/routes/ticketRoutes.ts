import { Router } from "express";

import { authMiddleware } from "../middlewares/authMiddleware";

import {
  bookTicket,
  getMyTickets,
  checkInTicket,
  initializePayment,
  verifyPayment,
} from "../controllers/ticketController";

const router = Router();

// =====================================================
// USER TICKET ROUTES
// =====================================================

// Book ticket
router.post("/book", authMiddleware, bookTicket);

// Get logged-in user's tickets
router.get("/my-tickets", authMiddleware, getMyTickets);

// Check in ticket
router.post("/check-in", authMiddleware, checkInTicket);

// =====================================================
// PAYSTACK PAYMENT
// =====================================================

// Initialize payment
router.post("/:ticketId/pay", authMiddleware, initializePayment);

// Verify payment
router.post("/:ticketId/verify", authMiddleware, verifyPayment);

export default router;
