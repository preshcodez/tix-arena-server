import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import * as QRCode from "qrcode";

import Ticket from "../models/ticketModel";
import Event from "../models/eventModel";
import { emailPurchaseTicket } from "../utils/emailPurchaseTicket";
import { uploadImage } from "../services/cloudinaryService";

// ==============================
// BOOK TICKET
// ==============================

export const bookTicket = async (
  userId: string,
  eventId: string,
  fullName: string,
  email: string,
  phoneNumber: string,
  ticketType: string,
  quantity: number,
) => {
  console.log("1. Starting booking");

  const event = await Event.findById(eventId);

  console.log("2. Event found:", !!event);

  if (!event) {
    throw new Error("Event not found");
  }

  // Event must be active
  if (!event.isActive) {
    throw new Error("This event is no longer available for booking");
  }

  console.log("3. Event is active");

  // Find selected ticket type
  const selectedTicket = event.tickets.find(
    (ticket) => ticket.name === ticketType,
  );

  console.log("4. Ticket type found:", !!selectedTicket);

  if (!selectedTicket) {
    throw new Error("Ticket type not found");
  }

  // Check ticket availability
  if (selectedTicket.quantity < quantity) {
    throw new Error("Not enough tickets available");
  }

  console.log("5. Tickets available");

  // Calculate total amount
  const totalAmount = selectedTicket.price * quantity;

  // Generate unique ticket code
  const ticketCode = uuidv4();

  console.log("6. Ticket code generated");

  // Generate QR code
  const qrCodeDataUrl = await QRCode.toDataURL(ticketCode);

  console.log("7. QR code generated");

  // Convert QR data URL to Buffer
  const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");

  const qrBuffer = Buffer.from(base64Data, "base64");

  // Upload QR code to Cloudinary
  const qrUpload = await uploadImage(qrBuffer, "tix-arena/tickets");

  const qrCode = qrUpload.secure_url;

  console.log("8. QR code uploaded to Cloudinary:", qrCode);

  // Convert IDs to ObjectIds
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const eventObjectId = new mongoose.Types.ObjectId(eventId);

  // Create ticket
  const ticket = await Ticket.create({
    user: userObjectId,
    event: eventObjectId,

    // Customer information
    fullName,
    email,
    phoneNumber,

    ticketType,
    quantity,
    totalAmount,

    paymentStatus: "pending",
    ticketStatus: "active",

    ticketCode,
    qrCode,
  });

  console.log("9. Ticket created:", ticket._id);

  // Reduce available tickets
  selectedTicket.quantity -= quantity;

  // Increase tickets sold
  selectedTicket.ticketSold += quantity;

  // Add attendee if they are not already attending
  const alreadyAttending = event.attendees.some(
    (attendee) => attendee.toString() === userId,
  );

  if (!alreadyAttending) {
    event.attendees.push(userObjectId);
  }

  // Save updated event
  await event.save();

  console.log("10. Event updated");

  return ticket;
};

// ==============================
// GET MY TICKETS
// ==============================

export const getMyTickets = async (userId: string) => {
  return Ticket.find({
    user: new mongoose.Types.ObjectId(userId),
  })
    .populate("event")
    .sort({ createdAt: -1 });
};

// ==============================
// CHECK IN TICKET
// ==============================

export const checkInTicket = async (ticketCode: string) => {
  const ticket = await Ticket.findOne({ ticketCode })
    .populate("event")
    .populate("user", "firstName lastName email");

  if (!ticket) {
    throw new Error("Invalid ticket");
  }

  if (ticket.paymentStatus !== "paid") {
    throw new Error("Ticket payment has not been completed");
  }

  if (ticket.ticketStatus === "cancelled") {
    throw new Error("This ticket has been cancelled");
  }

  if (ticket.checkedIn) {
    throw new Error("This ticket has already been checked in");
  }

  ticket.checkedIn = true;
  ticket.checkedInAt = new Date();
  ticket.ticketStatus = "used";

  await ticket.save();

  return ticket;
};

// ==============================
// PAY FOR TICKET
// ==============================

export const payForTicket = async (userId: string, ticketId: string) => {
  const ticket = await Ticket.findOne({
    _id: new mongoose.Types.ObjectId(ticketId),
    user: new mongoose.Types.ObjectId(userId),
  })
    .populate("event")
    .populate("user", "firstName lastName email");

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (ticket.ticketStatus === "cancelled") {
    throw new Error("Cancelled tickets cannot be paid for");
  }

  if (ticket.ticketStatus === "used") {
    throw new Error("This ticket has already been used");
  }

  if (ticket.paymentStatus === "paid") {
    throw new Error("Ticket has already been paid for");
  }

  // Mark payment as successful
  ticket.paymentStatus = "paid";

  await ticket.save();

  // Get user and event
  const user = ticket.user as any;
  const event = ticket.event as any;

  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

  // Send purchase confirmation email
  if (user?.email) {
    try {
      await emailPurchaseTicket({
        email: user.email,
        fullName,
        eventTitle: event?.title || "Your Event",
        eventDate: event?.date
          ? new Date(event.date).toLocaleDateString()
          : "N/A",
        eventLocation: event?.location || "N/A",
        ticketType: ticket.ticketType,
        quantity: ticket.quantity,
        totalAmount: ticket.totalAmount,
        ticketCode: ticket.ticketCode,
        qrCode: ticket.qrCode,
      });

      console.log(`Ticket confirmation email sent to ${user.email}`);
    } catch (error) {
      console.error("Payment successful but ticket email failed:", error);
    }
  }

  return ticket;
};
