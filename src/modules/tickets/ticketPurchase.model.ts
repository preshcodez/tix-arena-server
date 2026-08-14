import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITicketPurchase extends Document {
  _id: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  ticketType: mongoose.Types.ObjectId;
  ticketNumber: string;
  status: "valid" | "used" | "cancelled" | "refunded";
  pricePaid: number;
  checkedInAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ticketPurchaseSchema = new Schema<ITicketPurchase>(
  {
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    ticketType: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    ticketNumber: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["valid", "used", "cancelled", "refunded"],
      default: "valid",
      index: true,
    },
    pricePaid: { type: Number, required: true, min: 0 },
    checkedInAt: { type: Date },
  },
  { timestamps: true },
);

const TicketPurchase: Model<ITicketPurchase> = mongoose.model<ITicketPurchase>(
  "TicketPurchase",
  ticketPurchaseSchema,
);
export default TicketPurchase;
