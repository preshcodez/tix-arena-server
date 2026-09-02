import { Request, Response } from "express";
import * as ticketService from "../services/ticketService";

// =====================================================
// BOOK TICKET
// =====================================================

export const bookTicket = async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { eventId, phoneNumber, ticketType, quantity } = req.body;

    const ticket = await ticketService.bookTicket(
      userId,
      eventId,
      phoneNumber,
      ticketType,
      Number(quantity),
    );

    return res.status(201).json({
      success: true,
      message: "Ticket booked successfully",
      data: ticket,
    });
  } catch (error: any) {
    console.error("Book ticket error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to book ticket",
    });
  }
};

// =====================================================
// GET MY TICKETS
// =====================================================

export const getMyTickets = async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const tickets = await ticketService.getMyTickets(userId);

    return res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error: any) {
    console.error("Get my tickets error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to get tickets",
    });
  }
};

// =====================================================
// CHECK IN TICKET
// =====================================================

export const checkInTicket = async (req: Request, res: Response) => {
  try {
    const { ticketCode } = req.body;

    if (!ticketCode) {
      return res.status(400).json({
        success: false,
        message: "Ticket code is required",
      });
    }

    const ticket = await ticketService.checkInTicket(ticketCode);

    return res.status(200).json({
      success: true,
      message: "Ticket checked in successfully",
      data: ticket,
    });
  } catch (error: any) {
    console.error("Check-in error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to check in ticket",
    });
  }
};

// =====================================================
// INITIALIZE PAYMENT
// =====================================================

export const initializePayment = async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const ticketId = req.params.ticketId as string;

    const payment = await ticketService.initializePayment(userId, ticketId);

    return res.status(200).json({
      success: true,
      message: "Payment initialized successfully",
      data: payment,
    });
  } catch (error: any) {
    console.error("Initialize payment error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to initialize payment",
    });
  }
};

// =====================================================
// VERIFY PAYMENT
// =====================================================

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const ticketId = req.params.ticketId as string;
    const { reference } = req.body;

    const ticket = await ticketService.verifyPayment(
      userId,
      ticketId,
      reference,
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: ticket,
    });
  } catch (error: any) {
    console.error("Verify payment error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to verify payment",
    });
  }
};
