import { Request, Response, NextFunction } from "express";
import Vendor from "../models/vendorModel";

export const vendorMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const vendor = await Vendor.findOne({
      user: req.auth.sub,
      status: "approved",
    });

    if (!vendor) {
      res.status(403).json({
        success: false,
        message: "Approved vendor account required",
      });
      return;
    }

    req.vendor = vendor;

    next();
  } catch (error) {
    console.error("Vendor Middleware Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
