import mongoose, { Schema, Document, Model } from "mongoose";

const TicketSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Original number of tickets created by vendor
    totalQuantity: {
      type: Number,
      required: true,
      min: 0,
    },

    // Tickets currently available
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    // Tickets successfully sold
    ticketSold: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const SpeakerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    photo: {
      type: String,
      default: null,
    },

    isHeadliner: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);

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

  format: "Physical";

  price: number;

  tags: string[];

  tickets: {
    name: string;
    price: number;
    totalQuantity: number;
    quantity: number;
    ticketSold: number;
  }[];

  speakers: {
    name: string;
    photo?: string | null;
    isHeadliner: boolean;
  }[];

  attendees: mongoose.Types.ObjectId[];

  isActive: boolean;

  status: "pending" | "approved" | "rejected";

  rejectionReason?: string;

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

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    image: {
      type: String,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    subCategory: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    format: {
      type: String,
      enum: ["Physical"],
      required: true,
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    tags: {
      type: [String],
      default: [],
    },

    tickets: {
      type: [TicketSchema],
      default: [],
    },

    speakers: {
      type: [SpeakerSchema],
      default: [],
    },

    attendees: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
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
  },
  {
    timestamps: true,
  },
);

const Event: Model<IEvent> = mongoose.model<IEvent>(
  "Event",
  eventSchema,
);

export default Event;