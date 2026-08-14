import Vendor from "../models/vendorModel";
import User from "../models/userModel";

// Apply to become a vendor
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

  const existingVendor = await Vendor.findOne({
    user: userId,
  });

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

  return vendor;
};

