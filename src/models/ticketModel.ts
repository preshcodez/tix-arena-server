import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITicket extends Document {
  user: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;

  fullName: string;
  email: string;
  phoneNumber?: string;

  ticketType: string;
  quantity: number;
  totalAmount: number;

  paymentStatus: "pending" | "paid" | "failed";

  paystackReference?: string;

  ticketStatus: "active" | "used" | "cancelled";

  ticketCode: string;
  qrCode: string;

  checkedIn: boolean;
  checkedInAt?: Date;

  purchasedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phoneNumber: {
      type: String,
      trim: true,
    },

    ticketType: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      index: true,
    },

    paystackReference: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    ticketStatus: {
      type: String,
      enum: ["active", "used", "cancelled"],
      default: "active",
    },

    ticketCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    qrCode: {
      type: String,
      required: true,
    },

    checkedIn: {
      type: Boolean,
      default: false,
    },

    checkedInAt: {
      type: Date,
      default: null,
    },

    purchasedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const Ticket: Model<ITicket> = mongoose.model<ITicket>("Ticket", ticketSchema);

export default Ticket;
