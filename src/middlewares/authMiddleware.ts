import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { AuthPayload } from "../types/express";

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new ApiError(401, "Not authenticated. No token provided."));
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    next(new ApiError(401, "Not authenticated. No token provided."));
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as AuthPayload;

    req.auth = decoded;

    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token."));
  }
};
