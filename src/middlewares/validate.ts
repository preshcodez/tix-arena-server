import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError";

export const validate =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    if (typeof req.body.interests === "string") {
      try {
        req.body.interests = JSON.parse(req.body.interests);
      } catch {
        return next(new ApiError(400, "Invalid interests format."));
      }
    }

    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstError = result.error.issues[0];

      return next(new ApiError(400, firstError.message));
    }

    req.body = result.data;

    next();
  };
