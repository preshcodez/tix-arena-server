import express from "express";
import passport from "passport";
import cors from "cors";
import { errorHandler } from "./middlewares/errorMiddleware";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import eventRoutes from "./routes/eventRoutes";
import vendorRoutes from "./routes/vendorRoutes";
import ticketRoutes from "./routes/ticketRoutes";
import adminRoutes from "./routes/adminRoutes";

const app = express();

// --- Global middleware ---
app.use(
  cors({
    origin: process.env.CLIENT_URL, // only allow our TixArena frontend to call this API
    credentials: true, // allow cookies to be sent cross-origin
  }),
);

app.use(express.json()); // parses incoming JSON bodies into req.body
app.use(cookieParser()); // parses cookies into req.cookies

app.use(passport.initialize());

// --- Health check route ---
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// --- Routes will be mounted here ---
// app.use("/api/auth", authRouter);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);
app.use(errorHandler);
export default app;
