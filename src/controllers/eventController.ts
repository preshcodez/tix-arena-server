import { Request, Response } from "express";
import * as eventService from "../services/eventService";
import { uploadImage } from "../services/cloudinaryService";

export const createEvent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.vendor) {
      res.status(403).json({
        success: false,
        message: "Approved vendor account required",
      });
      return;
    }

    let imageUrl = req.body.image;

    // Upload image to Cloudinary if one was provided
    if (req.file) {
      const result = await uploadImage(req.file.buffer, "tix-arena/events");

      imageUrl = result.secure_url;
    }

    const eventData = {
      ...req.body,
      image: imageUrl,
    };

    const event = await eventService.createEvent(
      req.vendor._id.toString(),
      eventData,
    );

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    console.error("Create Event Error:", error);

    const message = error instanceof Error ? error.message : "Server Error";

    res.status(500).json({
      success: false,
      message,
    });
  }
};

export const getAllEvents = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const events = await eventService.getAllEvents();

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server Error";

    res.status(500).json({
      success: false,
      message,
    });
  }
};

export const getSingleEvent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const event = await eventService.getSingleEvent(req.params.id as string);

    if (!event) {
      res.status(404).json({
        success: false,
        message: "Event not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server Error";

    res.status(500).json({
      success: false,
      message,
    });
  }
};

export const updateEvent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.vendor) {
      res.status(403).json({
        success: false,
        message: "Approved vendor account required",
      });
      return;
    }

    let imageUrl = req.body.image;

    // Upload new image if provided
    if (req.file) {
      const result = await uploadImage(req.file.buffer, "tix-arena/events");

      imageUrl = result.secure_url;
    }

    const eventData = {
      ...req.body,
      ...(imageUrl && { image: imageUrl }),
    };

    const event = await eventService.updateEvent(
      req.vendor._id.toString(),
      req.params.id as string,
      eventData,
    );

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: event,
    });
  } catch (error) {
    console.error("Update Event Error:", error);

    const message = error instanceof Error ? error.message : "Server Error";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

// ==============================
// DELETE OWN EVENT
// ==============================

export const deleteEvent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.vendor) {
      res.status(403).json({
        success: false,
        message: "Approved vendor account required",
      });
      return;
    }

    const event = await eventService.deleteEvent(
      req.vendor._id.toString(),
      req.params.id as string,
    );

    if (!event) {
      res.status(404).json({
        success: false,
        message:
          "Event not found or you are not authorized to delete this event",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server Error";

    res.status(400).json({
      success: false,
      message,
    });
  }
};
export const getVendorEvents = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const events = await eventService.getVendorEvents(
      req.params.vendorId as string,
    );

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server Error";

    res.status(500).json({
      success: false,
      message,
    });
  }
};

export const closeEvent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.vendor) {
      res.status(403).json({
        success: false,
        message: "Approved vendor account required",
      });
      return;
    }

    const eventId = req.params.id as string;

    const event = await eventService.closeEvent(
      req.vendor._id.toString(),
      eventId,
    );

    res.status(200).json({
      success: true,
      message: "Event closed successfully",
      data: event,
    });
  } catch (error) {
    console.error("Close Event Error:", error);

    const message = error instanceof Error ? error.message : "Server Error";

    res.status(400).json({
      success: false,
      message,
    });
  }
};