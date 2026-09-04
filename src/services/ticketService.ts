import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import * as QRCode from "qrcode";
import axios from "axios";

import Ticket from "../models/ticketModel";
import Event from "../models/eventModel";
import User from "../models/userModel";
import { emailPurchaseTicket } from "../utils/emailPurchaseTicket";
import { uploadImage } from "../services/cloudinaryService";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

export const bookTicket = async (
  userId: string,
  eventId: string,
  phoneNumber: string | undefined,
  ticketType: string,
  quantity: number,
) => {
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(eventId)
  ) {
    throw new Error("Invalid user or event ID");
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const event = await Event.findOne({
    _id: eventId,
    isActive: true,
    status: "approved",
  });

  if (!event) {
    throw new Error("This event is unavailable or has not been approved");
  }

  const selectedTicket = event.tickets.find(
    (ticket) => ticket.name === ticketType,
  );

  if (!selectedTicket) {
    throw new Error("Ticket type not found");
  }

  // Prevent duplicate pending tickets for the exact same purchase.
  // A paid ticket is NOT reused, so the user can purchase again later.
  const existingPendingTicket = await Ticket.findOne({
    user: new mongoose.Types.ObjectId(userId),
    event: new mongoose.Types.ObjectId(eventId),
    ticketType,
    quantity,
    paymentStatus: "pending",
    ticketStatus: "active",
  });

  if (existingPendingTicket) {
    return existingPendingTicket;
  }

  // Reserve the requested tickets.
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

  if (!updatedEvent) {
    throw new Error(
      "Not enough tickets available. Someone may have purchased the remaining tickets first.",
    );
  }

  const updatedTicket = updatedEvent.tickets.find(
    (ticket) => ticket.name === ticketType,
  );

  if (!updatedTicket) {
    throw new Error("Ticket type could not be found");
  }

  const totalAmount = updatedTicket.price * quantity;
  const ticketCode = uuidv4();

  try {
    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(ticketCode);

    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");

    const qrBuffer = Buffer.from(base64Data, "base64");

    // Upload QR code to Cloudinary
    const qrUpload = await uploadImage(qrBuffer, "tix-arena/tickets");

    const qrCode = qrUpload.secure_url;

    // Create ticket
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

    // Add user to event attendees
    const alreadyAttending = updatedEvent.attendees.some(
      (attendee) => attendee.toString() === userId,
    );

    if (!alreadyAttending) {
      await Event.updateOne(
        { _id: eventId },
        {
          $addToSet: {
            attendees: new mongoose.Types.ObjectId(userId),
          },
        },
      );
    }

    return ticket;
  } catch (error) {
    // Restore ticket inventory if ticket creation fails.
    await Event.updateOne(
      { _id: eventId },
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

export const getMyTickets = async (userId: string) => {
  return Ticket.find({
    user: new mongoose.Types.ObjectId(userId),
  })
    .populate("event")
    .sort({
      createdAt: -1,
    });
};

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

  /*
   * Always initialize a fresh Paystack transaction for a pending ticket.
   *
   * This is important because an existing pending ticket may already have
   * an old Paystack reference, but the frontend needs a fresh accessCode
   * to open the Paystack popup with resumeTransaction().
   */
  const amountInKobo = Math.round(ticket.totalAmount * 100);

  const reference = `TIX-${ticket._id}-${Date.now()}`;

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

  if (ticket.paymentStatus === "paid") {
    return ticket;
  }

  if (ticket.paystackReference && ticket.paystackReference !== reference) {
    throw new Error("Payment reference does not match this ticket");
  }

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

  const expectedAmount = Math.round(ticket.totalAmount * 100);

  if (Number(payment.amount) !== expectedAmount) {
    throw new Error("Payment amount does not match ticket amount");
  }

  if (payment.currency && payment.currency !== "NGN") {
    throw new Error("Payment currency is invalid");
  }

  if (payment.status !== "success") {
    ticket.paymentStatus = "failed";

    await ticket.save();

    throw new Error(`Payment was not successful. Status: ${payment.status}`);
  }

  // Payment successful
  ticket.paymentStatus = "paid";
  ticket.paystackReference = reference;
  ticket.purchasedAt = new Date();

  await ticket.save();

  const user = ticket.user as any;
  const event = ticket.event as any;

  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

  // Send ticket confirmation email with QR code
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
