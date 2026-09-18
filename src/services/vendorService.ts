import User from "../models/userModel";
import Vendor from "../models/vendorModel";

import { sendEmail } from "../utils/sendEmail";

// ==============================
// APPLY TO BECOME A VENDOR
// ==============================

export const applyAsVendor = async (
  userId: string,
  data: {
    businessName: string;
    businessLogo?: string;
    description?: string;
  },
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "vendor") {
    throw new Error("You are already a vendor");
  }

  const existingVendor = await Vendor.findOne({ user: userId });

  if (existingVendor) {
    throw new Error("Vendor application already exists");
  }

  if (!data.businessName) {
    throw new Error("Business name is required");
  }

  const vendor = await Vendor.create({
    user: userId,
    businessName: data.businessName,
    businessLogo: data.businessLogo,
    description: data.description,
    status: "pending",
  });

  // ==============================
  // NOTIFY ADMIN
  // ==============================

  const adminEmail = process.env.ADMIN_EMAIL;

  if (adminEmail) {
    const applicantName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

    await sendEmail(
      adminEmail,
      "New Tix-Arena Vendor Application",
      `
        <div>
          <h2>New Vendor Application</h2>

          <p>Hello Admin,</p>

          <p>
            A new vendor application has been submitted on Tix-Arena.
          </p>

          <p>
            <strong>Applicant:</strong> ${applicantName || "N/A"}
          </p>

          <p>
            <strong>Email:</strong> ${user.email}
          </p>

          <p>
            <strong>Business Name:</strong> ${vendor.businessName}
          </p>

          <p>
            <strong>Status:</strong> Pending
          </p>

          <p>
            Please log in to the admin dashboard to review the application.
          </p>
        </div>
      `,
    );
  }

  return vendor;
};

// ==============================
// GET VENDOR PROFILE
// ==============================

export const getVendorProfile = async (userId: string) => {
  const vendor = await Vendor.findOne({ user: userId }).populate(
    "user",
    "firstName lastName email avatar",
  );

  if (!vendor) {
    throw new Error("Vendor profile not found");
  }

  return vendor;
};

// ==============================
// UPDATE VENDOR PROFILE
// ==============================

export const updateVendorProfile = async (
  userId: string,
  data: {
    businessName?: string;
    businessLogo?: string;
    description?: string;
  },
) => {
  const vendor = await Vendor.findOne({ user: userId });

  if (!vendor) {
    throw new Error("Vendor profile not found");
  }

  if (data.businessName !== undefined) {
    vendor.businessName = data.businessName;
  }

  if (data.businessLogo !== undefined) {
    vendor.businessLogo = data.businessLogo;
  }

  if (data.description !== undefined) {
    vendor.description = data.description;
  }

  await vendor.save();

  return vendor;
};
