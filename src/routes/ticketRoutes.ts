import { Router } from "express";

import { authMiddleware } from "../middlewares/authMiddleware";

import {
  bookTicket,
  getMyTickets,
  checkInTicket,
  payForTicket,
  verifyPayment,
} from "../controllers/ticketController";

const router = Router();

// ==============================
// USER ROUTES
// ==============================

// Book ticket
router.post("/book", authMiddleware, bookTicket);

// Get my tickets
router.get("/my-tickets", authMiddleware, getMyTickets);

// Check in ticket
router.post("/check-in", authMiddleware, checkInTicket);

// Initialize Paystack payment
router.patch("/:ticketId/pay", authMiddleware, payForTicket);

// Verify Paystack payment
router.post("/:ticketId/verify-payment", authMiddleware, verifyPayment);

export default router;
