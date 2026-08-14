import { IUser } from "../models/userModel";
import { IVendor } from "../models/vendorModel";

export interface AuthPayload {
  sub: string;
  role: "user" | "vendor" | "admin";
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
      user?: IUser;
      vendor?: IVendor;
    }
  }
}

export {};
