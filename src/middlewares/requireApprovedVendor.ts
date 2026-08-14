import { Request, Response, NextFunction } from "express";
import Vendor from "../models/vendorModel";
import { ApiError } from "../utils/ApiError";

export const requireApprovedVendor = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.auth) {
    return next(new ApiError(401, "Not authenticated."));
  }

  if (req.auth.role !== "vendor") {
    return next(
      new ApiError(403, "Only approved vendors can perform this action."),
    );
  }

  const vendor = await Vendor.findOne({ user: req.auth.sub });

  if (!vendor || vendor.status !== "approved") {
    return next(new ApiError(403, "Your vendor account is not approved yet."));
  }

  req.vendor = vendor;
  next();
};
