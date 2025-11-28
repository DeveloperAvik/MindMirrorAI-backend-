// src/app.ts
import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import fs from "fs";
import passport from "./App/Config/passport";
import authRouter from "./App/modules/auth/auth.route";
import scanRouter from "./App/modules/scan/scan.route";
import userRouter from "./App/modules/user/user.route";
import { ENV } from "./App/Config/env";

// Create app
const app = express();

// If behind a reverse proxy (nginx, render, vercel), this helps req.ip and secure cookies
// app.set("trust proxy", true);

// Security headers
app.use(helmet());

// CORS — restrict in production
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Body parsers
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Initialize passport (JWT + OAuth strategies loaded in Config/passport)
app.use(passport.initialize());

// Ensure upload dir exists and serve uploads for debugging/demo (private files should be protected)
if (!fs.existsSync(ENV.UPLOAD_DIR)) fs.mkdirSync(ENV.UPLOAD_DIR, { recursive: true });
// expose uploads at /uploads (careful in production — add auth if needed)
app.use("/uploads", express.static(path.resolve(ENV.UPLOAD_DIR)));

// Health
app.get("/health", (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// API routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/scan", scanRouter);
app.use("/api/v1/user", userRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ error: message });
});

export default app;
