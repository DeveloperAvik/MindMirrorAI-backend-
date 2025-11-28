// src/App/modules/scan/scan.route.ts
import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { ENV } from "../../Config/env";
import passport from "../../Config/passport";
import { handleScan } from "./scan.controller";
import fs from "fs";

const router = Router();

const UPLOAD_DIR = ENV.UPLOAD_DIR;
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: ENV.MAX_FILE_SIZE_BYTES } });

/**
 * Protected route: require JWT
 * Accepts multipart fields: image, audio
 */
router.post("/", passport.authenticate("jwt", { session: false }), upload.fields([
  { name: "image", maxCount: 1 },
  { name: "audio", maxCount: 1 }
]), async (req, res, next) => {
  try {
    await handleScan(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;
