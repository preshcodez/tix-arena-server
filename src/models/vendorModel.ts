import mongoose, { Document, Schema } from "mongoose";

export interface IVendor extends Document {
  user?: mongoose.Types.ObjectId | null;

  businessName: string;
  businessLogo?: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    // Only filled when an existing user becomes a vendor
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    businessName: {
      type: String,
      required: true,
      trim: true,
    },

    businessLogo: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

   
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IVendor>("Vendor", vendorSchema);
