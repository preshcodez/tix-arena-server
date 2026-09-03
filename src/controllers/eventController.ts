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

    let imageUrl: string | null = null;

    if (req.body?.image) {
      imageUrl = req.body.image;
    }

    // Upload event cover image to Cloudinary
    if (req.file) {
      const result = await uploadImage(req.file.buffer, "tix-arena/events");

      imageUrl = result.secure_url;
    }

    // Parse JSON fields coming from FormData
    let tickets = [];
    let speakers = [];
    let tags = [];

    try {
      tickets =
        typeof req.body.tickets === "string"
          ? JSON.parse(req.body.tickets)
          : req.body.tickets || [];

      speakers =
        typeof req.body.speakers === "string"
          ? JSON.parse(req.body.speakers)
          : req.body.speakers || [];

      tags =
        typeof req.body.tags === "string"
          ? JSON.parse(req.body.tags)
          : req.body.tags || [];
    } catch {
      res.status(400).json({
        success: false,
        message: "Invalid ticket, speaker or tag data.",
      });
      return;
    }

    const eventData = {
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      date: req.body.date,
      time: req.body.time,
      category: req.body.category,
      subCategory: req.body.subCategory,
      format: req.body.format,
      price: Number(req.body.price) || 0,
      tags,
      tickets,
      speakers,
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
