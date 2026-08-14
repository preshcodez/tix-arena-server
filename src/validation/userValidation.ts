import { z } from "zod";

// ==============================
// UPDATE MY PROFILE
// ==============================

export const updateMeSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(80, "First name is too long")
    .optional(),

  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(80, "Last name is too long")
    .optional(),

  avatar: z.string().nullable().optional(),

  interests: z.array(z.string().trim().min(1)).optional(),
});

// ==============================
// COMPLETE ONBOARDING
// ==============================

export const onboardingSchema = z.object({
  gender: z.enum(["male", "female"]),

  interests: z
    .array(z.string().trim().min(1))
    .min(1, "Please select at least one interest"),
});

// ==============================
// ADD MORE INTERESTS
// ==============================

export const addInterestsSchema = z.object({
  interests: z
    .array(z.string().trim().min(1))
    .min(1, "Please provide at least one interest"),
});
