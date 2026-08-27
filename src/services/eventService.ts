import Event from "../models/eventModel";
import Vendor from "../models/vendorModel";

// ==============================
// CREATE EVENT
// ==============================

export const createEvent = async (vendorId: string, eventData: any) => {
  const vendorExists = await Vendor.findById(vendorId);

  if (!vendorExists) {
    throw new Error("Vendor not found");
  }

  if (vendorExists.status !== "approved") {
    throw new Error("Vendor is not approved to create events");
  }

  const newEvent = await Event.create({
    vendor: vendorId,
    ...eventData,
    isActive:true,
  });

  return newEvent;
};

// ==============================
// GET ALL EVENTS
// ==============================

export const getAllEvents = async () => {
  return Event.find({
    status: "approved",
    isActive: true,
  })
    .populate("vendor", "businessName email")
    .sort({ createdAt: -1 });
};

// ==============================
// GET SINGLE EVENT
// ==============================

export const getSingleEvent = async (eventId: string) => {
  return Event.findById(eventId)
    .populate("vendor", "businessName email")
    .populate("attendees", "firstName lastName email");
};

// ==============================
// UPDATE OWN EVENT
// ==============================

export const updateEvent = async (
  vendorId: string,
  eventId: string,
  eventData: any,
) => {
  const event = await Event.findOne({
    _id: eventId,
    vendor: vendorId,
  });

  if (!event) {
    throw new Error(
      "Event not found or you are not authorized to update this event",
    );
  }

  // Prevent changing ownership
  delete eventData.vendor;

  Object.assign(event, eventData);

  await event.save();

  return event;
};

// ==============================
// DELETE OWN EVENT
// ==============================

export const deleteEvent = async (vendorId: string, eventId: string) => {
  const event = await Event.findOne({
    _id: eventId,
    vendor: vendorId,
  });

  if (!event) {
    throw new Error(
      "Event not found or you are not authorized to delete this event",
    );
  }

  await Event.findByIdAndDelete(eventId);

  return event;
};

// ==============================
// GET VENDOR EVENTS
// ==============================

export const getVendorEvents = async (vendorId: string) => {
  return Event.find({ vendor: vendorId }).sort({ createdAt: -1 });
};



export const closeEvent = async (vendorId: string, eventId: string) => {
  const event = await Event.findOne({
    _id: eventId,
    vendor: vendorId,
  });

  if (!event) {
    throw new Error(
      "Event not found or you are not authorized to close this event",
    );
  }

  if (!event.isActive) {
    throw new Error("Event is already closed");
  }

  event.isActive = false;

  await event.save();

  return event;
};
