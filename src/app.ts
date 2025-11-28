// src/app.ts (merge with existing)
import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import fs from "fs";
import path from "path";
import passport from "./App/Config/passport";
import authRouter from "./App/modules/auth/auth.route";
import scanRouter from "./App/modules/scan/scan.route";
import { ENV } from "./App/Config/env";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// init upload dir
if (!fs.existsSync(ENV.UPLOAD_DIR)) fs.mkdirSync(ENV.UPLOAD_DIR, { recursive: true });

// passport
app.use(passport.initialize());

// health
app.get("/health", (req, res) => res.json({ ok: true }));

// api
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/scan", scanRouter);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to MindMirror AI API" });
});

// static UI if any
const publicDir = path.join(__dirname, "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

export default app;
