import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as userService from "../services/userService";
import { uploadImage } from "../utils/uploadImage";

// ==============================
// GET MY PROFILE
// ==============================

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getMe(req.auth!.sub);

  res.status(200).json({
    success: true,
    data: { user },
  });
});

// ==============================
// UPDATE MY PROFILE
// ==============================

export const updateMe = catchAsync(async (req: Request, res: Response) => {
  let avatar: string | undefined;

  if (req.file) {
    const uploadedImage = await uploadImage(
      req.file.buffer,
      "tix-arena/profile-images",
    );

    avatar = uploadedImage.secure_url;
  }

  const user = await userService.updateMe(req.auth!.sub, {
    ...req.body,
    ...(avatar && { avatar }),
  });

  res.status(200).json({
    success: true,
    message: "Profile updated.",
    data: { user },
  });
});

// ==============================
// COMPLETE ONBOARDING
// ==============================

export const completeOnboarding = catchAsync(
  async (req: Request, res: Response) => {
    const user = await userService.completeOnboarding(
      req.auth!.sub,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Onboarding completed successfully.",
      data: { user },
    });
  },
);

// ==============================
// ADD MORE INTERESTS
// ==============================

export const addInterests = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.addInterests(
    req.auth!.sub,
    req.body.interests,
  );

  res.status(200).json({
    success: true,
    message: "Interests added successfully.",
    data: { user },
  });
});