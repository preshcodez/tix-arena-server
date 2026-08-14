import { Request, Response } from "express";
import * as vendorService from "../services/vendorService";
import { uploadImage } from "../services/cloudinaryService";

// ==============================
// APPLY TO BECOME A VENDOR
// ==============================

export const applyAsVendor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    let businessLogo = req.body.businessLogo;

    // Upload vendor logo to Cloudinary
    if (req.file) {
      const result = await uploadImage(req.file.buffer, "tix-arena/vendors");

      businessLogo = result.secure_url;
    }

    const vendorData = {
      ...req.body,
      ...(businessLogo && { businessLogo }),
    };

    const vendor = await vendorService.applyAsVendor(req.auth.sub, vendorData);

    res.status(201).json({
      success: true,
      message: "Vendor application submitted successfully",
      data: vendor,
    });
  } catch (error) {
    console.error("Apply Vendor Error:", error);

    const message = error instanceof Error ? error.message : "Server error";

    res.status(400).json({
      success: false,
      message,
    });
  }
};
