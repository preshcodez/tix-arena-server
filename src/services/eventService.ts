import Event from "../models/eventModel";
import Vendor from "../models/vendorModel";

import { sendEmail } from "../utils/sendEmail";

export const createEvent = async (vendorId: string, eventData: any) => {
  const vendor = await Vendor.findById(vendorId);

  if (!vendor) {
    throw new Error("Vendor not found");
  }

  if (vendor.status !== "approved") {
    throw new Error("Vendor is not approved to create events");
  }

  const event = await Event.create({
    vendor: vendorId,
    ...eventData,
    status: "pending",
    isActive: false,
  });

  // ==========================================
  // NOTIFY ADMIN OF NEW EVENT
  // ==========================================

  const adminEmail = process.env.ADMIN_EMAIL;

  if (adminEmail) {
    await sendEmail(
      adminEmail,
      "New Tix-Arena Event Awaiting Approval",
      `
        <div>
          <h2>New Event Awaiting Approval</h2>

          <p>Hello Admin,</p>

          <p>
            A new event has been created by an approved vendor
            and is waiting for your approval.
          </p>

          <p>
            <strong>Event:</strong>
            ${event.title}
          </p>

          <p>
            <strong>Vendor:</strong>
            ${vendor.businessName}
          </p>

          <p>
            <strong>Location:</strong>
            ${event.location}
          </p>

          <p>
            <strong>Date:</strong>
            ${event.date}
          </p>

          <p>
            <strong>Time:</strong>
            ${event.time}
          </p>

          <p>
            <strong>Status:</strong>
            Pending
          </p>

          <p>
            Please log in to the admin dashboard to review
            and approve or reject this event.
          </p>
        </div>
      `,
    );
  }

  return event;
};

export const getAllEvents = async () => {
  return Event.find({
    status: "approved",
    isActive: true,
  })
    .populate("vendor", "businessName businessLogo email")
    .sort({ createdAt: -1 });
};

export const getSingleEvent = async (eventId: string) => {
  const event = await Event.findById(eventId)
    .populate("vendor", "businessName businessLogo email")
    .populate("attendees", "firstName lastName email avatar");

  if (!event) {
    throw new Error("Event not found");
  }

  return event;
};

export const updateEvent = async (
  eventId: string,
  vendorId: string,
  eventData: any,
) => {
  const event = await Event.findOne({
    _id: eventId,
    vendor: vendorId,
  });

  if (!event) {
    throw new Error("Event not found or you are not the owner");
  }

  delete eventData.vendor;

  Object.assign(event, eventData);

  await event.save();

  return event;
};

export const deleteEvent = async (eventId: string, vendorId: string) => {
  const event = await Event.findOneAndDelete({
    _id: eventId,
    vendor: vendorId,
  });

  if (!event) {
    throw new Error("Event not found or you are not the owner");
  }

  return event;
};

export const getVendorEvents = async (vendorId: string) => {
  return Event.find({
    vendor: vendorId,
  }).sort({ createdAt: -1 });
};

export const closeEvent = async (eventId: string, vendorId: string) => {
  const event = await Event.findOne({
    _id: eventId,
    vendor: vendorId,
  });

  if (!event) {
    throw new Error("Event not found or you are not the owner");
  }

  event.isActive = false;

  await event.save();

  return event;
};
