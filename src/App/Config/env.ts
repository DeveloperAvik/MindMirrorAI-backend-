import dotenv from "dotenv";
import path from "path";

dotenv.config();

const get = (k: string, fallback?: string) => process.env[k] ?? fallback;

export const ENV = {
  NODE_ENV: get("NODE_ENV", "development"),
  PORT: Number(get("PORT", "4000")),
  MONGO_URI: get("MONGO_URI", "mongodb://localhost:27017/mindmirror"),
  JWT_SECRET: get("JWT_SECRET", "please-change-this-secret"),
  JWT_EXPIRES_IN: get("JWT_EXPIRES_IN", "7d"),
  UPLOAD_DIR: get("UPLOAD_DIR", path.join(process.cwd(), "uploads")),
  MAX_FILE_SIZE_BYTES: Number(get("MAX_FILE_SIZE_BYTES", "5000000")),
  OTP_TTL_SECONDS: Number(get("OTP_TTL_SECONDS", "600")),
};
