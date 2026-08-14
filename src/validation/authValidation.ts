import { z } from "zod";

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(80),

    lastName: z.string().trim().min(1, "Last name is required").max(80),

    email: z.string().trim().toLowerCase().email("Invalid email address"),

    password: z.string().min(8, "Password must be at least 8 characters"),

    confirmPassword: z.string(),

    role: z.enum(["user", "vendor"]).optional(),

    // Used for direct vendor registration
    businessName: z.string().optional(),

    businessLogo: z.string().optional(),

    description: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),

  otp: z.string().length(4, "OTP must be 4 digits"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),

  password: z.string().min(1, "Password is required"),
});
