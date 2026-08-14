import { Request, Response, NextFunction } from "express";

export const adminAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.auth) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (req.auth.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Admin access required",
    });
    return;
  }

  next();
};
