// src/App/Utils/token.ts
import jwt from "jsonwebtoken";
import { ENV } from "../Config/env";

export function generateAccessToken(payload: object) {
  return jwt.sign(payload, ENV.JWT_ACCESS_SECRET, { expiresIn: ENV.JWT_ACCESS_EXPIRES });
}

export function generateRefreshToken(payload: object) {
  return jwt.sign(payload, ENV.JWT_REFRESH_SECRET, { expiresIn: ENV.JWT_REFRESH_EXPIRES });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ENV.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, ENV.JWT_REFRESH_SECRET);
}
