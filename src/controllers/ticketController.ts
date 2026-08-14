import { Request, Response } from "express";
import * as ticketService from "../services/ticketService";

// ==============================
// BOOK TICKET
// ==============================

export const bookTicket = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const { eventId, fullName, email, phoneNumber, ticketType, quantity } =
      req.body || {};

    if (
      !eventId ||
      !fullName ||
      !email ||
      !phoneNumber ||
      !ticketType ||
      quantity === undefined
    ) {
      res.status(400).json({
        success: false,
        message:
          "Event ID, full name, email, phone number, ticket type and quantity are required",
      });
      return;
    }

    if (quantity < 1) {
      res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
      return;
    }

    const ticket = await ticketService.bookTicket(
      req.auth.sub,
      eventId,
      fullName,
      email,
      phoneNumber,
      ticketType,
      quantity,
    );

    res.status(201).json({
      success: true,
      message: "Ticket booked successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("Book Ticket Error:", error);

    const message =
      error instanceof Error ? error.message : "Internal Server Error";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

// ==============================
// GET MY TICKETS
// ==============================

export const getMyTickets = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const tickets = await ticketService.getMyTickets(req.auth.sub);

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Get My Tickets Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ==============================
// CHECK IN TICKET
// ==============================

export const checkInTicket = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { ticketCode } = req.body;

    if (!ticketCode) {
      res.status(400).json({
        success: false,
        message: "Ticket code is required",
      });
      return;
    }

    const ticket = await ticketService.checkInTicket(ticketCode);

    res.status(200).json({
      success: true,
      message: "Check-in successful",
      ticket,
    });
  } catch (error) {
    console.error("Check In Ticket Error:", error);

    const message =
      error instanceof Error ? error.message : "Internal Server Error";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

// ==============================
// PAY FOR TICKET
// ==============================

export const payForTicket = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const ticket = await ticketService.payForTicket(
      req.auth.sub,
      req.params.ticketId as string,
    );

    res.status(200).json({
      success: true,
      message: "Payment successful",
      ticket,
    });
  } catch (error) {
    console.error("Pay For Ticket Error:", error);

    const message =
      error instanceof Error ? error.message : "Internal Server Error";

    res.status(400).json({
      success: false,
      message,
    });
  }
};
