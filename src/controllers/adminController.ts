import { Request, Response } from "express";
import * as adminService from "../services/adminService";

// ==============================
// GET ADMIN DASHBOARD STATS
// ==============================

export const getDashboardStats = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const stats = await adminService.getDashboardStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get Dashboard Stats Error:", error);

    const message = error instanceof Error ? error.message : "Server Error";

    res.status(500).json({
      success: false,
      message,
    });
  }
};

// ==============================
// GET ALL VENDORS
// ==============================

export const getAllVendors = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const vendors = await adminService.getAllVendors();

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors,
    });
  } catch (error) {
    console.error("Get All Vendors Error:", error);

    const message = error instanceof Error ? error.message : "Server Error";

    res.status(500).json({
      success: false,
      message,
    });
  }
};

// ==============================
// GET PENDING VENDORS
// ==============================

export const getPendingVendors = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const vendors = await adminService.getPendingVendors();

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors,
    });
  } catch (error) {
    console.error("Get Pending Vendors Error:", error);

    const message = error instanceof Error ? error.message : "Server Error";

    res.status(500).json({
      success: false,
      message,
    });
  }
};

// ==============================
// APPROVE VENDOR
// ==============================

export const approveVendor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const vendor = await adminService.approveVendor(
      req.params.vendorId as string,
    );

    if (!vendor) {
      res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Vendor approved successfully",
      data: vendor,
    });
  } catch (error) {
    console.error("Approve Vendor Error:", error);

    const message = error instanceof Error ? error.message : "Server Error";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

// ==============================
// REJECT VENDOR
// ==============================

export const rejectVendor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { rejectionReason } = req.body || {};

    if (!rejectionReason) {
      res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
      return;
    }

    const vendor = await adminService.rejectVendor(
      req.params.vendorId as string,
      rejectionReason,
    );

    if (!vendor) {
      res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Vendor rejected successfully",
      data: vendor,
    });
  } catch (error) {
    console.error("Reject Vendor Error:", error);

    const message = error instanceof Error ? error.message : "Server Error";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

// ==============================
// APPROVE EVENT
// ==============================

export const approveEvent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const event = await adminService.approveEvent(req.params.eventId as string);

    if (!event) {
      res.status(404).json({
        success: false,
        message: "Event not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Event approved successfully",
      data: event,
    });
  } catch (error) {
    console.error("Approve Event Error:", error);

    const message = error instanceof Error ? error.message : "Server Error";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

// ==============================
// REJECT EVENT
// ==============================

export const rejectEvent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { rejectionReason } = req.body || {};

    if (!rejectionReason) {
      res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
      return;
    }

    const event = await adminService.rejectEvent(
      req.params.eventId as string,
      rejectionReason,
    );

    if (!event) {
      res.status(404).json({
        success: false,
        message: "Event not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Event rejected successfully",
      data: event,
    });
  } catch (error) {
    console.error("Reject Event Error:", error);

    const message = error instanceof Error ? error.message : "Server Error";

    res.status(400).json({
      success: false,
      message,
    });
  }
};
