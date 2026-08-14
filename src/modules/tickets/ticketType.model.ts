import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITicket extends Document {
  _id: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  sold: number;
  maxPerOrder?: number;
  salesStart?: Date;
  salesEnd?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    sold: { type: Number, default: 0, min: 0 },
    maxPerOrder: { type: Number, min: 1, default: 10 },
    salesStart: { type: Date },
    salesEnd: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const Ticket: Model<ITicket> = mongoose.model<ITicket>("Ticket", ticketSchema);
export default Ticket;
