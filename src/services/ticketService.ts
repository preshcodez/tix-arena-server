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
// No reservation is created.
//
// MongoDB atomically checks:
//
// quantity >= requested quantity
//
// AND decreases the quantity in the same operation.
//
// This prevents two users from buying the same final tickets.
// =====================================================

export const bookTicket = async (
  userId: string,
  eventId: string,
  phoneNumber: string | undefined,
  ticketType: string,
  quantity: number,
) => {
  // ---------------------------------------------------
  // Validate IDs
  // ---------------------------------------------------

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(eventId)
  ) {
    throw new Error("Invalid user or event ID");
  }

  // ---------------------------------------------------
  // Validate quantity
  // ---------------------------------------------------

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  // ---------------------------------------------------
  // Get user
  // ---------------------------------------------------

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // ---------------------------------------------------
  // Get event
  // ---------------------------------------------------

  const event = await Event.findOne({
    _id: eventId,
    isActive: true,
    status: "approved",
  });

  if (!event) {
    throw new Error("This event is unavailable or has not been approved");
  }

  // ---------------------------------------------------
  // Find selected ticket type
  // ---------------------------------------------------

  const selectedTicket = event.tickets.find(
    (ticket) => ticket.name === ticketType,
  );

  if (!selectedTicket) {
    throw new Error("Ticket type not found");
  }

  // ---------------------------------------------------
  // FIRST-COME-FIRST-SERVED ATOMIC UPDATE
  // ---------------------------------------------------
  //
  // IMPORTANT:
  //
  // We do NOT simply:
  //
  //   if (quantity >= requested)
  //   quantity -= requested
  //
  // because two users could pass that check
  // simultaneously.
  //
  // Instead MongoDB performs the condition and update
  // as one atomic operation.
  //
  // Example:
  //
  // 1 ticket remaining
  //
  // User A requests 1
  // User B requests 1
  //
  // Only ONE operation can successfully match:
  //
  // quantity >= 1
  //
  // The other receives null.
  // ---------------------------------------------------

  const updatedEvent = await Event.findOneAndUpdate(
    {
      _id: eventId,
      isActive: true,
      status: "approved",

      tickets: {
        $elemMatch: {
          name: ticketType,
          quantity: {
            $gte: quantity,
          },
        },
      },
    },

    {
      $inc: {
        "tickets.$[ticket].quantity": -quantity,
        "tickets.$[ticket].ticketSold": quantity,
      },
    },

    {
      arrayFilters: [
        {
          "ticket.name": ticketType,
          "ticket.quantity": {
            $gte: quantity,
          },
        },
      ],

      new: true,
    },
  );

  // ---------------------------------------------------
  // No ticket available
  // ---------------------------------------------------

  if (!updatedEvent) {
    throw new Error(
      "Not enough tickets available. Someone may have purchased the remaining tickets first.",
    );
  }

  // ---------------------------------------------------
  // Get the ticket information AFTER atomic update
  // ---------------------------------------------------

  const updatedTicket = updatedEvent.tickets.find(
    (ticket) => ticket.name === ticketType,
  );

  if (!updatedTicket) {
    throw new Error("Ticket type could not be found");
  }

  // ---------------------------------------------------
  // Calculate amount
  // ---------------------------------------------------

  const totalAmount = updatedTicket.price * quantity;

  // ---------------------------------------------------
  // Generate ticket code
  // ---------------------------------------------------

  const ticketCode = uuidv4();

  // ---------------------------------------------------
  // Generate QR code
  // ---------------------------------------------------

  const qrCodeDataUrl = await QRCode.toDataURL(ticketCode);

  // ---------------------------------------------------
  // Convert QR base64 to buffer
  // ---------------------------------------------------

  const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");

  const qrBuffer = Buffer.from(base64Data, "base64");

  // ---------------------------------------------------
  // Upload QR to Cloudinary
  // ---------------------------------------------------

  const qrUpload = await uploadImage(qrBuffer, "tix-arena/tickets");

  const qrCode = qrUpload.secure_url;

  // ---------------------------------------------------
  // Create pending ticket
  // ---------------------------------------------------
  //
  // IMPORTANT:
  //
  // The ticket is NOT paid yet.
  //
  // It starts as:
  //
  // paymentStatus: "pending"
  //
  // Then Paystack payment is initialized.
  //
  // After Paystack confirms payment:
  //
  // paymentStatus -> "paid"
  // ---------------------------------------------------

  try {
    const ticket = await Ticket.create({
      user: new mongoose.Types.ObjectId(userId),

      event: new mongoose.Types.ObjectId(eventId),

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
    });

    // -------------------------------------------------
    // Add attendee
    // -------------------------------------------------

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
            attendees: new mongoose.Types.ObjectId(userId),
          },
        },
      );
    }

    return ticket;
  } catch (error) {
    // -------------------------------------------------
    // IMPORTANT SAFETY ROLLBACK
    // -------------------------------------------------
    //
    // If the ticket document cannot be created after
    // inventory was successfully reduced, restore
    // the inventory.
    // -------------------------------------------------

    await Event.updateOne(
      {
        _id: eventId,
      },
      {
        $inc: {
          "tickets.$[ticket].quantity": quantity,
          "tickets.$[ticket].ticketSold": -quantity,
        },
      },
      {
        arrayFilters: [
          {
            "ticket.name": ticketType,
          },
        ],
      },
    );

    throw error;
  }
};

// =====================================================
// GET MY TICKETS
// =====================================================

export const getMyTickets = async (userId: string) => {
  return Ticket.find({
    user: new mongoose.Types.ObjectId(userId),
  })
    .populate("event")
    .sort({
      createdAt: -1,
    });
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
    _id: ticketId,
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

  // ---------------------------------------------------
  // If payment was already initialized, don't create
  // another Paystack transaction unnecessarily.
  // ---------------------------------------------------

  if (ticket.paystackReference) {
    return {
      ticketId: ticket._id,
      reference: ticket.paystackReference,
      amount: ticket.totalAmount,
    };
  }

  // ---------------------------------------------------
  // Convert NGN to Kobo
  //
  // ₦5,000 = 500,000 kobo
  // ---------------------------------------------------

  const amountInKobo = Math.round(ticket.totalAmount * 100);

  // ---------------------------------------------------
  // Generate unique reference
  // ---------------------------------------------------

  const reference = `TIX-${ticket._id}-${Date.now()}`;

  // ---------------------------------------------------
  // Paystack initialization
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // Save reference
  // ---------------------------------------------------

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

  if (!reference) {
    throw new Error("Payment reference is required");
  }

  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    throw new Error("Invalid ticket ID");
  }

  const ticket = await Ticket.findOne({
    _id: ticketId,

    user: new mongoose.Types.ObjectId(userId),
  })
    .populate("event")
    .populate("user", "firstName lastName email");

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  // ---------------------------------------------------
  // Already paid
  // ---------------------------------------------------

  if (ticket.paymentStatus === "paid") {
    return ticket;
  }

  // ---------------------------------------------------
  // Reference must match
  // ---------------------------------------------------

  if (ticket.paystackReference && ticket.paystackReference !== reference) {
    throw new Error("Payment reference does not match this ticket");
  }

  // ---------------------------------------------------
  // Verify transaction with Paystack
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // Check amount
  // ---------------------------------------------------

  const expectedAmount = Math.round(ticket.totalAmount * 100);

  if (Number(payment.amount) !== expectedAmount) {
    throw new Error("Payment amount does not match ticket amount");
  }

  // ---------------------------------------------------
  // Check currency
  // ---------------------------------------------------

  if (payment.currency && payment.currency !== "NGN") {
    throw new Error("Payment currency is invalid");
  }

  // ---------------------------------------------------
  // Check status
  // ---------------------------------------------------

  if (payment.status !== "success") {
    ticket.paymentStatus = "failed";

    await ticket.save();

    throw new Error(`Payment was not successful. Status: ${payment.status}`);
  }

  // ---------------------------------------------------
  // Payment successful
  // ---------------------------------------------------

  ticket.paymentStatus = "paid";

  ticket.paystackReference = reference;

  ticket.purchasedAt = new Date();

  await ticket.save();

  // ---------------------------------------------------
  // SEND PURCHASE EMAIL
  // ---------------------------------------------------

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
