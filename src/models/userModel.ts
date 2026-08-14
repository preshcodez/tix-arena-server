import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;

  firstName: string;
  lastName: string;
  email: string;

  avatar?: string | null;

  googleId?: string;
  passwordHash?: string;

  role: "user" | "vendor" | "admin";

  isVerified: boolean;

  otp?: string;
  otpExpires?: Date;

  gender?: "male" | "female";
  interests: string[];

  onboardingCompleted: boolean;

  createdAt: Date;
  updatedAt: Date;

  setPassword(password: string): Promise<void>;
  verifyPassword(password: string): Promise<boolean>;
  generateOTP(): string;
  verifyOTP(otp: string): boolean;
}

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    avatar: {
      type: String,
      default: null,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    passwordHash: {
      type: String,
      select: false,
      required: function requiredPasswordHash(this: IUser) {
        return !this.googleId;
      },
    },

    role: {
      type: String,
      enum: ["user", "vendor", "admin"],
      default: "user",
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    otp: {
      type: String,
      select: false,
    },

    otpExpires: {
      type: Date,
      select: false,
    },

    gender: {
      type: String,
      enum: ["male", "female"],
    },

    interests: {
      type: [String],
      default: [],
    },

    // ==============================
    // ONBOARDING
    // ==============================

    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// ==============================
// PASSWORD
// ==============================

userSchema.methods.setPassword = async function (password: string) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

userSchema.methods.verifyPassword = async function (password: string) {
  if (!this.passwordHash) return false;

  return bcrypt.compare(password, this.passwordHash);
};

// ==============================
// OTP
// ==============================

userSchema.methods.generateOTP = function () {
  const otp = crypto.randomInt(1000, 10000).toString();

  this.otp = crypto.createHash("sha256").update(otp).digest("hex");

  this.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  return otp;
};

userSchema.methods.verifyOTP = function (otp: string) {
  if (!this.otp || !this.otpExpires) {
    return false;
  }

  const hashed = crypto.createHash("sha256").update(otp).digest("hex");

  const isValid = this.otp === hashed;

  const isExpired = Date.now() > this.otpExpires.getTime();

  return isValid && !isExpired;
};

// ==============================
// JSON TRANSFORM
// ==============================

userSchema.set("toJSON", {
  virtuals: true,

  transform: (_doc, ret: Record<string, any>) => {
    delete ret.passwordHash;
    delete ret.otp;
    delete ret.otpExpires;

    return ret;
  },
});

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
