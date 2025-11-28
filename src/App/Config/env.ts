import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),

  // Database
  MONGO_URI: process.env.MONGO_URI as string,

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || "1d",

  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || "30d",

  BCRYPT_SALT_ROUND: Number(process.env.BCRYPT_SALT_ROUND || 12),

  // OTP
  OTP_TTL_SECONDS: Number(process.env.OTP_TTL_SECONDS || 600),

  // Email
  EMAIL_USER: process.env.EMAIL_USER as string,
  EMAIL_PASS: process.env.EMAIL_PASS as string,
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || "gmail",

  // File Upload
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  MAX_FILE_SIZE_BYTES: Number(process.env.MAX_FILE_SIZE_BYTES || 5_000_000),

  // ML
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || "http://localhost:8000",

  // Plan
  DEFAULT_USER_PLAN: process.env.DEFAULT_USER_PLAN || "free",

  // OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,

  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || "",
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || "",
  GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL || "",

  // Frontend after OAuth
  OAUTH_REDIRECT_URL: process.env.OAUTH_REDIRECT_URL || "http://localhost:5173",
};
