import User from "../models/userModel";
import { ApiError } from "../utils/ApiError";

// ==============================
// GET MY PROFILE
// ==============================

export const getMe = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return {
    ...user.toObject(),
    fullName,
  };
};

// ==============================
// UPDATE MY PROFILE
// ==============================

interface UpdateMeInput {
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  interests?: string[];
}

export const updateMe = async (userId: string, input: UpdateMeInput) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // Update first name
  if (input.firstName !== undefined) {
    user.firstName = input.firstName.trim();
  }

  // Update last name
  if (input.lastName !== undefined) {
    user.lastName = input.lastName.trim();
  }

  // Update profile image
  if (input.avatar !== undefined) {
    user.avatar = input.avatar;
  }

  // Update interests
  if (input.interests !== undefined) {
    user.interests = input.interests;
  }

  // Gender is NOT updated here.
  // Gender is only collected during onboarding.

  await user.save();

  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return {
    ...user.toObject(),
    fullName,
  };
};

// ==============================
// COMPLETE ONBOARDING
// ==============================

interface OnboardingInput {
  gender: "male" | "female";
  interests: string[];
}

export const completeOnboarding = async (
  userId: string,
  input: OnboardingInput,
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (user.onboardingCompleted) {
    throw new ApiError(400, "Onboarding has already been completed.");
  }

  if (!input.gender) {
    throw new ApiError(400, "Gender is required.");
  }

  if (!Array.isArray(input.interests) || input.interests.length === 0) {
    throw new ApiError(400, "Please select at least one interest.");
  }

  user.gender = input.gender;

  user.interests = input.interests
    .map((interest) => interest.trim())
    .filter((interest) => interest.length > 0);

  user.onboardingCompleted = true;

  await user.save();

  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return {
    ...user.toObject(),
    fullName,
  };
};

// ==============================
// ADD MORE INTERESTS
// ==============================

export const addInterests = async (userId: string, interests: string[]) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (!Array.isArray(interests) || interests.length === 0) {
    throw new ApiError(400, "Please provide at least one interest.");
  }

  const cleanedInterests = interests
    .map((interest) => interest.trim())
    .filter((interest) => interest.length > 0);

  if (cleanedInterests.length === 0) {
    throw new ApiError(400, "Please provide valid interests.");
  }

  // Prevent duplicate interests
  const newInterests = cleanedInterests.filter(
    (interest) =>
      !user.interests.some(
        (existingInterest) =>
          existingInterest.toLowerCase() === interest.toLowerCase(),
      ),
  );

  user.interests.push(...newInterests);

  await user.save();

  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return {
    ...user.toObject(),
    fullName,
  };
};
