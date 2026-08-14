import { Router } from "express";

import { authMiddleware } from "../middlewares/authMiddleware";

import {
  bookTicket,
  getMyTickets,
  checkInTicket,
  payForTicket,
} from "../controllers/ticketController";

const router = Router();

// ================= USER ROUTES =================

// Book ticket
router.post("/book", authMiddleware, bookTicket);

// Get my tickets
router.get("/my-tickets", authMiddleware, getMyTickets);

// Check in ticket
router.post("/check-in", authMiddleware, checkInTicket);



// Pay for ticket - FREE TEST PAYMENT
router.patch("/:ticketId/pay", authMiddleware, payForTicket);



export default router;
