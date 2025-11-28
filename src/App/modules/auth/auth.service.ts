import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../user/user.model";
import { ENV } from "../../Config/env";
import crypto from "crypto";
import dayjs from "dayjs";

const SALT_ROUNDS = 10;

export async function registerStep1(email: string, password: string) {
  const existing = await UserModel.findOne({ email });
  if (existing) {
    throw new Error("Email already registered");
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const otp = (Math.floor(100000 + Math.random() * 900000)).toString(); // 6-digit
  const otpExpires = dayjs().add(ENV.OTP_TTL_SECONDS, "second").toDate();

  const user = await UserModel.create({
    email,
    passwordHash,
    otp,
    otpExpires,
    isActive: false,
  });

  // TODO: send OTP via email/SMS here (mocked)
  console.log(`[DEV] OTP for ${email}: ${otp} (expires ${otpExpires})`);

  return { tempUserId: user._id.toString(), message: "OTP sent to email (dev console)" };
}

export async function verifyOtpAndActivate(tempUserId: string, otp: string) {
  const user = await UserModel.findById(tempUserId).select("+otp +otpExpires");
  if (!user) throw new Error("User not found");

  if (!user.otp || !user.otpExpires) throw new Error("No OTP set, please register again");
  if (user.otp !== otp) throw new Error("Invalid OTP");
  if (user.otpExpires < new Date()) throw new Error("OTP expired");

  user.isActive = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  const token = jwt.sign({ sub: user._id.toString(), email: user.email }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  });
  return { token };
}

export async function login(email: string, password: string) {
  const user = await UserModel.findOne({ email }).select("+passwordHash");
  if (!user) throw new Error("Invalid credentials");
  if (!user.passwordHash) throw new Error("Invalid credentials");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error("Invalid credentials");
  if (!user.isActive) throw new Error("Account not activated");

  const token = jwt.sign({ sub: user._id.toString(), email: user.email }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  });
  return { token, user: { id: user._id.toString(), email: user.email, name: user.name, plan: user.plan } };
}
