import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  vendor: mongoose.Types.ObjectId;
  title: string;
  image?: string | null;
  description?: string;
  location: string;
  date: Date;
  time: string;
  category: string;
  subCategory: string;
  tags: string[];
  status: "pending" | "approved" | "rejected";
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    image: { type: String, default: null },
    description: { type: String, trim: true, maxlength: 1000 },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    date: { type: Date, required: true },
    time: { type: String, required: true, trim: true, maxlength: 10 },
    category: { type: String, required: true, trim: true, maxlength: 120 },
    subCategory: { type: String, required: true, trim: true, maxlength: 120 },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Event: Model<IEvent> = mongoose.model<IEvent>("Event", eventSchema);
export default Event;
