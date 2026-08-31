import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import * as QRCode from "qrcode";
import axios from "axios";

import Ticket from "../models/ticketModel";
import Event from "../models/eventModel";
import User from "../models/userModel";

import { emailPurchaseTicket } from "../utils/emailPurchaseTicket";
import { uploadImage } from "../services/cloudinaryService";

// =====================================================
// PAYSTACK CONFIG
// =====================================================

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// =====================================================
// BOOK TICKET
// =====================================================
// FIRST-COME-FIRST-SERVED
//
// IMPORTANT:
// We do NOT reserve/hold tickets.
//
// MongoDB atomically checks that enough tickets remain
// and decreases the quantity in the same operation.
//
// Whoever successfully performs this operation first
// gets the available ticket(s).
// =====================================================

export const bookTicket = async (
  userId: string,
  eventId: string,
  phoneNumber: string | undefined,
  ticketType: string,
  quantity: number,
) => {
  // -----------------------------------------------
  // VALIDATE USER
  // -----------------------------------------------

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // -----------------------------------------------
  // VALIDATE INPUT
  // -----------------------------------------------

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new Error("Invalid event ID");
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  if (!ticketType?.trim()) {
    throw new Error("Ticket type is required");
  }

  // -----------------------------------------------
  // CHECK EVENT
  // -----------------------------------------------

  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error("Event not found");
  }

  if (!event.isActive) {
    throw new Error("This event is no longer available for booking");
  }

  // -----------------------------------------------
  // FIND TICKET TYPE
  // -----------------------------------------------

  const selectedTicket = event.tickets.find(
    (ticket) => ticket.name === ticketType,
  );

  if (!selectedTicket) {
    throw new Error("Ticket type not found");
  }

  // -----------------------------------------------
  // ATOMIC FIRST-COME-FIRST-SERVED STOCK CHECK
  // -----------------------------------------------
  //
  // We DO NOT do:
  //
  //   if (quantity is available)
  //      save()
  //
  // because two people could read the same quantity
  // at almost the same time.
  //
  // Instead MongoDB performs:
  //
  //   quantity >= requested quantity
  //
  // AND
  //
  //   quantity = quantity - requested quantity
  //
  // in ONE atomic operation.
  //
  // Therefore, if only 1 ticket remains and two people
  // request it at the same time, only ONE succeeds.
  // -----------------------------------------------

  const updatedEvent = await Event.findOneAndUpdate(
    {
      _id: eventId,
      isActive: true,
      "tickets.name": ticketType,
      "tickets.quantity": { $gte: quantity },
    },
    {
      $inc: {
        "tickets.$.quantity": -quantity,
        "tickets.$.ticketSold": quantity,
      },
    },
    {
      new: true,
    },
  );

  if (!updatedEvent) {
    throw new Error(
      "Not enough tickets available. Someone may have purchased the remaining tickets just before you.",
    );
  }

  // -----------------------------------------------
  // GET THE UPDATED TICKET TYPE
  // -----------------------------------------------

  const updatedTicket = updatedEvent.tickets.find(
    (ticket) => ticket.name === ticketType,
  );

  if (!updatedTicket) {
    throw new Error("Ticket type not found after booking");
  }

  // -----------------------------------------------
  // CALCULATE TOTAL
  // -----------------------------------------------

  const totalAmount = updatedTicket.price * quantity;

  // -----------------------------------------------
  // GENERATE TICKET CODE
  // -----------------------------------------------

  const ticketCode = uuidv4();

  // -----------------------------------------------
  // GENERATE QR CODE
  // -----------------------------------------------

  const qrCodeDataUrl = await QRCode.toDataURL(ticketCode);

  const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");

  const qrBuffer = Buffer.from(base64Data, "base64");

  // -----------------------------------------------
  // UPLOAD QR CODE TO CLOUDINARY
  // -----------------------------------------------

  const qrUpload = await uploadImage(qrBuffer, "tix-arena/tickets");

  const qrCode = qrUpload.secure_url;

  // -----------------------------------------------
  // CONVERT IDS
  // -----------------------------------------------

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const eventObjectId = new mongoose.Types.ObjectId(eventId);

  // -----------------------------------------------
  // CREATE TICKET
  // -----------------------------------------------

  let ticket;

  try {
    ticket = await Ticket.create({
      user: userObjectId,
      event: eventObjectId,

      fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),

      email: user.email,

      phoneNumber: phoneNumber?.trim() || undefined,

      ticketType,

      quantity,

      totalAmount,

      paymentStatus: "pending",

      ticketStatus: "active",

      ticketCode,

      qrCode,

      checkedIn: false,
    });
  } catch (error) {
    // -------------------------------------------
    // IMPORTANT ROLLBACK
    // -------------------------------------------
    //
    // If creating the ticket fails after stock was
    // decreased, put the stock back.
    // -------------------------------------------

    await Event.updateOne(
      {
        _id: eventId,
        "tickets.name": ticketType,
      },
      {
        $inc: {
          "tickets.$.quantity": quantity,
          "tickets.$.ticketSold": -quantity,
        },
      },
    );

    throw error;
  }

  // -----------------------------------------------
  // ADD USER AS ATTENDEE
  // -----------------------------------------------

  const alreadyAttending = updatedEvent.attendees.some(
    (attendee) => attendee.toString() === userId,
  );

  if (!alreadyAttending) {
    await Event.updateOne(
      {
        _id: eventId,
      },
      {
        $addToSet: {
          attendees: userObjectId,
        },
      },
    );
  }

  return ticket;
};

// =====================================================
// GET MY TICKETS
// =====================================================

export const getMyTickets = async (userId: string) => {
  return Ticket.find({
    user: new mongoose.Types.ObjectId(userId),
  })
    .populate("event")
    .sort({ createdAt: -1 });
};

// =====================================================
// CHECK IN TICKET
// =====================================================

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

// =====================================================
// INITIALIZE PAYSTACK PAYMENT
// =====================================================

export const initializePayment = async (userId: string, ticketId: string) => {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    throw new Error("Invalid ticket ID");
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

  // -----------------------------------------------
  // PREVENT DUPLICATE PAYMENT INITIALIZATION
  // -----------------------------------------------

  if (ticket.paystackReference) {
    throw new Error("Payment has already been initialized for this ticket");
  }

  // -----------------------------------------------
  // CONVERT NAIRA TO KOBO
  // -----------------------------------------------

  const amountInKobo = Math.round(ticket.totalAmount * 100);

  // -----------------------------------------------
  // CREATE UNIQUE REFERENCE
  // -----------------------------------------------

  const reference = `TIX-${ticket._id}-${Date.now()}`;

  // -----------------------------------------------
  // PAYSTACK INITIALIZATION
  // -----------------------------------------------

  const response = await axios.post(
    "https://api.paystack.co/transaction/initialize",
    {
      email: ticket.email,

      amount: amountInKobo,

      currency: "NGN",

      reference,

      callback_url:
        `${CLIENT_URL}/payment/callback` + `?ticketId=${ticket._id}`,

      metadata: {
        ticketId: ticket._id.toString(),

        userId,

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

  const paystackData = response.data.data;

  // -----------------------------------------------
  // SAVE PAYSTACK REFERENCE
  // -----------------------------------------------

  ticket.paystackReference = paystackData.reference;

  await ticket.save();

  return {
    ticketId: ticket._id,

    reference: paystackData.reference,

    authorizationUrl: paystackData.authorization_url,

    accessCode: paystackData.access_code,

    amount: ticket.totalAmount,
  };
};

// =====================================================
// VERIFY PAYSTACK PAYMENT
// =====================================================

export const verifyPayment = async (
  userId: string,
  ticketId: string,
  reference: string,
) => {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    throw new Error("Invalid ticket ID");
  }

  if (!reference?.trim()) {
    throw new Error("Payment reference is required");
  }

  // -----------------------------------------------
  // FIND TICKET
  // -----------------------------------------------

  const ticket = await Ticket.findOne({
    _id: new mongoose.Types.ObjectId(ticketId),

    user: new mongoose.Types.ObjectId(userId),
  })
    .populate("event")
    .populate("user", "firstName lastName email");

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  // -----------------------------------------------
  // ALREADY PAID
  // -----------------------------------------------

  if (ticket.paymentStatus === "paid") {
    return ticket;
  }

  // -----------------------------------------------
  // REFERENCE MUST MATCH
  // -----------------------------------------------

  if (!ticket.paystackReference || ticket.paystackReference !== reference) {
    throw new Error("Payment reference does not match this ticket");
  }

  // -----------------------------------------------
  // VERIFY WITH PAYSTACK
  // -----------------------------------------------

  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(
      reference,
    )}`,
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

  // -----------------------------------------------
  // CHECK PAYMENT STATUS
  // -----------------------------------------------

  if (payment.status !== "success") {
    ticket.paymentStatus = "failed";

    await ticket.save();

    throw new Error(`Payment was not successful. Status: ${payment.status}`);
  }

  // -----------------------------------------------
  // CHECK AMOUNT
  // -----------------------------------------------

  const expectedAmount = Math.round(ticket.totalAmount * 100);

  if (Number(payment.amount) !== expectedAmount) {
    throw new Error("Payment amount does not match ticket amount");
  }

  // -----------------------------------------------
  // CHECK CURRENCY
  // -----------------------------------------------

  if (payment.currency && payment.currency !== "NGN") {
    throw new Error("Payment currency is invalid");
  }

  // -----------------------------------------------
  // CHECK PAYMENT REFERENCE
  // -----------------------------------------------

  if (payment.reference !== reference) {
    throw new Error("Payment reference is invalid");
  }

  // -----------------------------------------------
  // MARK TICKET AS PAID
  // -----------------------------------------------

  ticket.paymentStatus = "paid";

  ticket.paystackReference = reference;

  ticket.purchasedAt = new Date();

  await ticket.save();

  // -----------------------------------------------
  // SEND PURCHASE EMAIL
  // -----------------------------------------------

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

      console.log(`Ticket confirmation email sent to ${user.email}`);
    } catch (error) {
      console.error("Payment successful but ticket email failed:", error);
    }
  }

  return ticket;
};
