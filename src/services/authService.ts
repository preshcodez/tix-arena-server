import User from "../models/userModel";
import Vendor from "../models/vendorModel";
import { sendEmail } from "../utils/sendEmail";
import { generateToken } from "../utils/generateToken";
import { ApiError } from "../utils/ApiError";
import { consumeExchangeCode } from "../oauth/oauthExchange";

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: "user" | "vendor";

  // Only used when registering directly as a vendor
  businessName?: string;
  businessLogo?: string;
  description?: string;
}

export const registerUser = async (input: RegisterInput) => {
  const email = input.email.trim().toLowerCase();

  // ==========================================
  // CHECK IF EMAIL ALREADY EXISTS
  // ==========================================

  const existing = await User.findOne({ email });

  if (existing) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  // ==========================================
  // DIRECT VENDOR VALIDATION
  // ==========================================

  if (input.role === "vendor" && !input.businessName?.trim()) {
    throw new ApiError(
      400,
      "Business name is required for vendor registration.",
    );
  }

  // ==========================================
  // CREATE USER
  // ==========================================

  const user = new User({
    firstName: input.firstName,
    lastName: input.lastName,
    email,
    role: input.role || "user",
  });

  await user.setPassword(input.password);

  // ==========================================
  // GENERATE OTP
  // ==========================================

  const otp = user.generateOTP();

  // ==========================================
  // SAVE USER
  // ==========================================

  await user.save();

  // ==========================================
  // DIRECT VENDOR REGISTRATION
  // ==========================================
  // If the person selected "vendor" during
  // registration, create the Vendor document.
  //
  // IMPORTANT:
  // The vendor starts as PENDING.
  // Admin must approve before events can
  // be created.
  // ==========================================

  if (input.role === "vendor") {
    await Vendor.create({
      user: user._id,
      businessName: input.businessName!.trim(),
      businessLogo: input.businessLogo || "",
      description: input.description || "",
      status: "approved",
    });
  }

  // ==========================================
  // SEND VERIFICATION EMAIL
  // ==========================================

  await sendEmail(
    user.email,
    "Verify your TixArena account",
    `<h2>Your verification code is: ${otp}</h2>
     <p>Expires in 10 minutes.</p>`,
  );

  return {
    id: user._id,
    email: user.email,
  };
};

// ==========================================
// VERIFY EMAIL
// ==========================================

export const verifyEmail = async (email: string, otp: string) => {
  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  }).select("+otp +otpExpires");

  if (!user || !user.verifyOTP(otp)) {
    throw new ApiError(400, "Invalid or expired verification code.");
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;

  await user.save();

  const token = generateToken(user);

  return {
    token,
    user,
  };
};

// ==========================================
// LOGIN
// ==========================================

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  }).select("+passwordHash");

  if (!user || !(await user.verifyPassword(password))) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email before logging in.");
  }

  const token = generateToken(user);

  return {
    token,
    user,
  };
};

// ==========================================
// GOOGLE EXCHANGE
// ==========================================

export const exchangeGoogleCode = async (code: string) => {
  const userId = consumeExchangeCode(code);

  if (!userId) {
    throw new ApiError(400, "Invalid or expired code.");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const token = generateToken(user);

  return {
    token,
    user,
  };
};
