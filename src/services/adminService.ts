import Vendor from "../models/vendorModel";
import Event from "../models/eventModel";
import User from "../models/userModel";

import { sendApprovalEmail } from "../utils/approveEmail";
import { sendRejectionEmail } from "../utils/rejectEmail";

// ==============================
// GET ALL VENDORS
// ==============================

export const getAllVendors = async () => {
  return await Vendor.find()
    .populate("user", "firstName lastName email")
    .sort({ createdAt: -1 });
};

// ==============================
// GET PENDING VENDORS
// ==============================

export const getPendingVendors = async () => {
  return await Vendor.find({
    status: "pending",
  })
    .populate("user", "firstName lastName email")
    .sort({ createdAt: -1 });
};

// ==============================
// APPROVE VENDOR
// ==============================

export const approveVendor = async (vendorId: string) => {
  const vendor = await Vendor.findByIdAndUpdate(
    vendorId,
    {
      status: "approved",
      approvedAt: new Date(),
      rejectionReason: "",
    },
    {
      new: true,
      runValidators: true,
    },
  ).populate("user", "firstName lastName email");

  if (!vendor) {
    return null;
  }

  // ==========================================
  // CHANGE USER ROLE TO VENDOR AFTER APPROVAL
  // ==========================================

  const user = vendor.user as any;

  if (user?._id) {
    await User.findByIdAndUpdate(user._id, {
      role: "vendor",
    });
  }

  // ==============================
  // SEND APPROVAL EMAIL
  // ==============================

  if (user?.email) {
    const fullName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
      vendor.businessName;

    await sendApprovalEmail(user.email, fullName, "vendor");
  }

  return vendor;
};

// ==============================
// REJECT VENDOR
// ==============================

export const rejectVendor = async (
  vendorId: string,
  rejectionReason: string,
) => {
  const vendor = await Vendor.findByIdAndUpdate(
    vendorId,
    {
      status: "rejected",
      rejectionReason,
    },
    {
      new: true,
      runValidators: true,
    },
  ).populate("user", "firstName lastName email");

  if (!vendor) {
    return null;
  }

  const user = vendor.user as any;

  // ==============================
  // SEND REJECTION EMAIL
  // ==============================

  if (user?.email) {
    const fullName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
      vendor.businessName;

    await sendRejectionEmail(user.email, fullName, "vendor", rejectionReason);
  }

  return vendor;
};

// ==============================
// APPROVE EVENT
// ==============================

export const approveEvent = async (eventId: string) => {
  const event = await Event.findByIdAndUpdate(
    eventId,
    {
      status: "approved",
      rejectionReason: "",
    },
    {
      new: true,
      runValidators: true,
    },
  ).populate({
    path: "vendor",
    populate: {
      path: "user",
      select: "firstName lastName email",
    },
  });

  if (!event) {
    return null;
  }

  const vendor = event.vendor as any;
  const user = vendor?.user;

  // ==============================
  // SEND APPROVAL EMAIL
  // ==============================

  if (user?.email) {
    const fullName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
      vendor.businessName;

    await sendApprovalEmail(user.email, fullName, "event", event.title);
  }

  return event;
};

// ==============================
// REJECT EVENT
// ==============================

export const rejectEvent = async (eventId: string, rejectionReason: string) => {
  const event = await Event.findByIdAndUpdate(
    eventId,
    {
      status: "rejected",
      rejectionReason,
    },
    {
      new: true,
      runValidators: true,
    },
  ).populate({
    path: "vendor",
    populate: {
      path: "user",
      select: "firstName lastName email",
    },
  });

  if (!event) {
    return null;
  }

  const vendor = event.vendor as any;
  const user = vendor?.user;

  // ==============================
  // SEND REJECTION EMAIL
  // ==============================

  if (user?.email) {
    const fullName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
      vendor.businessName;

    await sendRejectionEmail(
      user.email,
      fullName,
      "event",
      rejectionReason,
      event.title,
    );
  }

  return event;
};

// ==============================
// GET ADMIN DASHBOARD STATS
// ==============================

export const getDashboardStats = async () => {
  const [
    totalVendors,
    totalEvents,
    totalUsers,
    vendorUsers,
    mostCreatedCategories,
  ] = await Promise.all([
    // Total vendor applications/accounts
    Vendor.countDocuments(),

    // Total events
    Event.countDocuments(),

    // Users whose current role is user
    User.countDocuments({
      role: "user",
    }),

    // Users whose current role is vendor
    User.countDocuments({
      role: "vendor",
    }),

    // Most created event categories
    Event.aggregate([
      {
        $group: {
          _id: "$category",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $limit: 5,
      },
    ]),
  ]);

  const totalUserAndVendors = totalUsers + vendorUsers;

  const userPercentage =
    totalUserAndVendors > 0
      ? Number(((totalUsers / totalUserAndVendors) * 100).toFixed(2))
      : 0;

  const vendorPercentage =
    totalUserAndVendors > 0
      ? Number(((vendorUsers / totalUserAndVendors) * 100).toFixed(2))
      : 0;

  return {
    totalVendors,
    totalEvents,

    userVendorRatio: {
      users: totalUsers,
      vendors: vendorUsers,
      userPercentage,
      vendorPercentage,
    },

    mostCreatedCategories,
  };
};
