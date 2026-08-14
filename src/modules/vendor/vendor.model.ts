import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVendor extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  businessName: string;
  businessLogo?: string | null;
  description?: string;
  status: "pending" | "approved" | "rejected";
  payoutDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    businessName: { type: String, required: true, trim: true, maxlength: 120 },
    businessLogo: { type: String, default: null },
    description: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    payoutDetails: {
      bankName: { type: String, select: false },
      accountNumber: { type: String, select: false },
      accountName: { type: String, select: false },
    },
  },
  { timestamps: true },
);

const Vendor: Model<IVendor> = mongoose.model<IVendor>("Vendor", vendorSchema);
export default Vendor;
