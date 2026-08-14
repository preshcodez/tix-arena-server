import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as authService from "../services/authService";

export const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json({
    success: true,
    message: "Registered. Check your email for a verification code.",
    data: result,
  });
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const { token, user } = await authService.verifyEmail(email, otp);
  res.status(200).json({
    success: true,
    message: "Email verified successfully.",
    data: { token, user },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { token, user } = await authService.loginUser(email, password);
  res.status(200).json({
    success: true,
    message: "Logged in successfully.",
    data: { token, user },
  });
});

export const googleExchange = catchAsync(
  async (req: Request, res: Response) => {
    const { code } = req.body;
    const result = await authService.exchangeGoogleCode(code);
    res.status(200).json({ success: true, data: result });
  },
);
