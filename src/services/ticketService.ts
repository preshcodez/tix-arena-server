import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import * as QRCode from "qrcode";
import axios from "axios";

import Ticket from "../models/ticketModel";
import Event from "../models/eventModel";
import { emailPurchaseTicket } from "../utils/emailPurchaseTicket";
import { uploadImage } from "../services/cloudinaryService";

// ==============================
// PAYSTACK CONFIG
// ==============================

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

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
  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error("Event not found");
  }

  if (!event.isActive) {
    throw new Error("This event is no longer available for booking");
  }

  const selectedTicket = event.tickets.find(
    (ticket) => ticket.name === ticketType,
  );

  if (!selectedTicket) {
    throw new Error("Ticket type not found");
  }

  if (selectedTicket.quantity < quantity) {
    throw new Error("Not enough tickets available");
  }

  // Calculate total
  const totalAmount = selectedTicket.price * quantity;

  // Generate ticket code
  const ticketCode = uuidv4();

  // Generate QR code
  const qrCodeDataUrl = await QRCode.toDataURL(ticketCode);

  // Convert QR code to buffer
  const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");

  const qrBuffer = Buffer.from(base64Data, "base64");

  // Upload QR to Cloudinary
  const qrUpload = await uploadImage(qrBuffer, "tix-arena/tickets");

  const qrCode = qrUpload.secure_url;

  // Convert IDs
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const eventObjectId = new mongoose.Types.ObjectId(eventId);

  // Create ticket
  const ticket = await Ticket.create({
    user: userObjectId,
    event: eventObjectId,

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

  // Reduce available tickets
  selectedTicket.quantity -= quantity;

  // Increase sold tickets
  selectedTicket.ticketSold += quantity;

  // Add attendee
  const alreadyAttending = event.attendees.some(
    (attendee) => attendee.toString() === userId,
  );

  if (!alreadyAttending) {
    event.attendees.push(userObjectId);
  }

  await event.save();

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
  const ticket = await Ticket.findOne({
    ticketCode,
  })
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
// INITIALIZE PAYSTACK PAYMENT
// ==============================

export const initializePayment = async (userId: string, ticketId: string) => {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  const ticket = await Ticket.findOne({
    _id: new mongoose.Types.ObjectId(ticketId),
    user: new mongoose.Types.ObjectId(userId),
  });

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

  if (ticket.totalAmount <= 0) {
    throw new Error("This ticket does not require payment");
  }

  // Paystack expects amount in kobo.
  // ₦5,000 = 500,000 kobo
  const amountInKobo = Math.round(ticket.totalAmount * 100);

  // Unique reference
  const reference = `TIX-${ticket._id}-${Date.now()}`;

  const response = await axios.post(
    "https://api.paystack.co/transaction/initialize",
    {
      email: ticket.email,

      amount: amountInKobo,

      currency: "NGN",

      reference,

      callback_url: `${CLIENT_URL}/payment/callback`,

      metadata: {
        ticketId: ticket._id.toString(),
        userId: userId,
        ticketType: ticket.ticketType,
        quantity: ticket.quantity,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,

        "Content-Type": "application/json",
      },
    },
  );

  if (!response.data?.status) {
    throw new Error(
      response.data?.message || "Unable to initialize Paystack payment",
    );
  }

  ticket.paystackReference = response.data.data.reference;

  await ticket.save();

  return {
    ticketId: ticket._id,
    reference: response.data.data.reference,

    authorizationUrl: response.data.data.authorization_url,

    accessCode: response.data.data.access_code,

    amount: ticket.totalAmount,
  };
};

// ==============================
// VERIFY PAYSTACK PAYMENT
// ==============================

export const verifyPayment = async (
  userId: string,
  ticketId: string,
  reference: string,
) => {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  const ticket = await Ticket.findOne({
    _id: new mongoose.Types.ObjectId(ticketId),
    user: new mongoose.Types.ObjectId(userId),
  })
    .populate("event")
    .populate("user", "firstName lastName email");

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (ticket.paymentStatus === "paid") {
    return ticket;
  }

  if (ticket.paystackReference && ticket.paystackReference !== reference) {
    throw new Error("Payment reference does not match this ticket");
  }

  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    },
  );

  const payment = response.data?.data;

  if (!response.data?.status || !payment) {
    throw new Error("Unable to verify Paystack payment");
  }

  // Paystack amount is in kobo.
  const expectedAmount = Math.round(ticket.totalAmount * 100);

  // VERY IMPORTANT:
  // Check payment status AND amount.
  if (payment.status !== "success") {
    ticket.paymentStatus = "failed";
    await ticket.save();

    throw new Error(`Payment was not successful. Status: ${payment.status}`);
  }

  if (Number(payment.amount) !== expectedAmount) {
    throw new Error("Payment amount does not match ticket amount");
  }

  if (payment.currency && payment.currency !== "NGN") {
    throw new Error("Payment currency is invalid");
  }

  // Mark ticket as paid
  ticket.paymentStatus = "paid";

  ticket.paystackReference = reference;

  await ticket.save();

  // ==============================
  // SEND PURCHASE EMAIL
  // ==============================

  const user = ticket.user as any;
  const event = ticket.event as any;

  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

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
    } catch (error) {
      console.error("Payment successful but ticket email failed:", error);
    }
  }

  return ticket;
};
