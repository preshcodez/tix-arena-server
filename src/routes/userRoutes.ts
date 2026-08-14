import express from "express";

import {
  getMe,
  updateMe,
  completeOnboarding,
  addInterests,
} from "../controllers/userController";

import { authMiddleware } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validate";

import {
  updateMeSchema,
  onboardingSchema,
  addInterestsSchema,
} from "../validation/userValidation";

const router = express.Router();

// ==============================
// GET MY PROFILE
// ==============================

router.get("/me", authMiddleware, getMe);

// ==============================
// UPDATE MY PROFILE
// ==============================

router.patch("/me", authMiddleware, validate(updateMeSchema), updateMe);

// ==============================
// COMPLETE ONBOARDING
// ==============================

router.post(
  "/onboarding",
  authMiddleware,
  validate(onboardingSchema),
  completeOnboarding,
);

// ==============================
// ADD MORE INTERESTS
// ==============================

router.post(
  "/interests",
  authMiddleware,
  validate(addInterestsSchema),
  addInterests,
);

export default router;
