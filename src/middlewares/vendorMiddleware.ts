import { Request, Response, NextFunction } from "express";
import Vendor from "../models/vendorModel";

const vendorMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.auth?.sub) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const vendor = await Vendor.findOne({
      user: req.auth.sub,
      status: "approved",
    });

    if (!vendor) {
      res.status(403).json({
        message: "Approved vendor account required",
      });
      return;
    }

    req.vendor = vendor;
    next();
  } catch (error) {
    next(error);
  }
};

export default vendorMiddleware;
