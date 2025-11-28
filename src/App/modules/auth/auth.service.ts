// src/App/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import dayjs from "dayjs";
import { ENV } from "../../Config/env";
import UserModel from "../user/user.model";
import DeviceModel from "../device/device.model";
import RefreshModel from "./refresh.model";
import { sendMail } from "../../Config/mailer";
import { generateAccessToken, generateRefreshToken } from "../../Utils/token";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = Number(ENV.BCRYPT_SALT_ROUND ?? 12);

function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function parseDays(spec: string | undefined, fallback = 30) {
  if (!spec) return fallback;
  // support "30d", "7", "14d", etc.
  const num = parseInt(spec.replace(/\D/g, ""), 10);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

/** Register step: create user + otp
 *  Cases:
 *   - New user -> create and send OTP
 *   - Existing user && not active -> resend OTP and return tempUserId
 *   - Existing user && active -> throw error
 */
export async function registerStep1(email: string, password: string) {
  const existing = await UserModel.findOne({ email }).select("+otp +otpExpires +isActive");

  // Case: existing user but NOT active -> resend OTP
  if (existing && !existing.isActive) {
    const otp = genOtp();
    const otpExpires = dayjs().add(ENV.OTP_TTL_SECONDS, "second").toDate();

    existing.otp = otp;
    existing.otpExpires = otpExpires;
    await existing.save();

    try {
      await sendMail({
        to: email,
        subject: "Your MindMirror OTP (Resent)",
        text: `Your OTP is ${otp}. It expires in ${ENV.OTP_TTL_SECONDS} seconds.`,
        html: `<p>Your OTP is <strong>${otp}</strong>. It expires in ${ENV.OTP_TTL_SECONDS} seconds.</p>`,
      });
    } catch (e) {
      console.warn("Mailer failed while resending OTP:", e);
    }

    console.log(`[DEV] Resent OTP for existing user ${email}: ${otp}`);
    return {
      tempUserId: existing._id.toString(),
      message: "Account exists but not verified — OTP resent",
    };
  }

  // Case: existing user and active -> can't register
  if (existing && existing.isActive) {
    throw new Error("Email already registered");
  }

  // Case: new user -> create and send OTP
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const otp = genOtp();
  const otpExpires = dayjs().add(ENV.OTP_TTL_SECONDS, "second").toDate();

  const user = await UserModel.create({
    email,
    passwordHash,
    otp,
    otpExpires,
    isActive: false,
    plan: ENV.DEFAULT_USER_PLAN ?? "free",
  });

  try {
    await sendMail({
      to: email,
      subject: "Your MindMirror OTP",
      text: `Your OTP is ${otp}. It expires in ${ENV.OTP_TTL_SECONDS} seconds.`,
      html: `<p>Your OTP is <strong>${otp}</strong>. It expires in ${ENV.OTP_TTL_SECONDS} seconds.</p>`,
    });
  } catch (e) {
    console.warn("Mailer failed while sending initial OTP:", e);
  }

  console.log(`[DEV] New user OTP for ${email}: ${otp}`);
  return { tempUserId: user._id.toString(), message: "OTP sent" };
}

/** Resend OTP */
export async function resendOtp(tempUserId: string) {
  const user = await UserModel.findById(tempUserId).select("+email");
  if (!user) throw new Error("User not found");

  const otp = genOtp();
  const otpExpires = dayjs().add(ENV.OTP_TTL_SECONDS, "second").toDate();

  const updated = await UserModel.findByIdAndUpdate(tempUserId, { otp, otpExpires }, { new: true }).select("+email");
  if (!updated) throw new Error("User not found after update");

  try {
    await sendMail({
      to: updated.email,
      subject: "MindMirror OTP (resend)",
      text: `Your OTP is ${otp}. It expires in ${ENV.OTP_TTL_SECONDS} seconds.`,
      html: `<p>Your OTP is <strong>${otp}</strong>. It expires in ${ENV.OTP_TTL_SECONDS} seconds.</p>`,
    });
  } catch (e) {
    console.warn("Mailer failed while resending OTP:", e);
  }

  console.log(`[DEV] Resent OTP for ${updated.email}: ${otp}`);
  return { message: "OTP resent" };
}

/** Activate via OTP */
export async function verifyOtpAndActivate(tempUserId: string, otp: string) {
  const user = await UserModel.findById(tempUserId).select("+otp +otpExpires +email");
  if (!user) throw new Error("User not found");
  if (!user.otp || !user.otpExpires) throw new Error("No OTP set, please register again");
  if (user.otp !== otp) throw new Error("Invalid OTP");
  if (user.otpExpires < new Date()) throw new Error("OTP expired");

  const updated = await UserModel.findByIdAndUpdate(
    tempUserId,
    { isActive: true, otp: undefined, otpExpires: undefined },
    { new: true }
  ).select("+email");

  if (!updated) throw new Error("Failed to activate user");

  const access = generateAccessToken({ sub: updated._id.toString(), email: updated.email });
  const refresh = generateRefreshToken({ sub: updated._id.toString(), email: updated.email });

  // store refresh token with computed expiry date
  const days = parseDays(ENV.JWT_REFRESH_EXPIRES, 30);
  const expiresAt = dayjs().add(days, "day").toDate();
  await RefreshModel.create({ user: updated._id, token: refresh, expiresAt });

  return { token: access, refreshToken: refresh };
}

/** Login — returns access + refresh */
export async function login(email: string, password: string, ip?: string, ua?: string) {
  const user = await UserModel.findOne({ email }).select("+passwordHash +isActive");
  if (!user) throw new Error("Invalid credentials");
  if (!user.passwordHash) throw new Error("Invalid credentials");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error("Invalid credentials");
  if (!user.isActive) throw new Error("Account not activated");

  try {
    await DeviceModel.create({ user: user._id, ip: ip || "unknown", ua: ua || "" });
  } catch (e) {
    console.warn("Device log failed:", e);
  }

  const access = generateAccessToken({ sub: user._id.toString(), email: user.email });
  const refresh = generateRefreshToken({ sub: user._id.toString(), email: user.email });

  const days = parseDays(ENV.JWT_REFRESH_EXPIRES, 30);
  const expiresAt = dayjs().add(days, "day").toDate();
  await RefreshModel.create({ user: user._id, token: refresh, expiresAt });

  return {
    token: access,
    refreshToken: refresh,
    user: { id: user._id.toString(), email: user.email, name: user.name, plan: user.plan },
  };
}

/** Refresh access token using refresh token */
export async function refreshAccessToken(refreshToken: string) {
  try {
    // verify structure & signature
    const payload: any = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET);
    // ensure refresh exists in DB
    const entry = await RefreshModel.findOne({ token: refreshToken });
    if (!entry) throw new Error("Invalid refresh token");

    const access = generateAccessToken({ sub: payload.sub, email: payload.email });
    return { token: access };
  } catch (e: any) {
    throw new Error("Invalid refresh token");
  }
}

/** Logout (revoke refresh token) */
export async function logout(refreshToken: string) {
  await RefreshModel.findOneAndDelete({ token: refreshToken });
  return { message: "Logged out" };
}

/** Forgot password - sends reset OTP */
export async function forgotPassword(email: string) {
  const user = await UserModel.findOne({ email }).select("+email");
  if (!user) throw new Error("User not found");

  const otp = genOtp();
  const otpExpires = dayjs().add(ENV.OTP_TTL_seconds ?? ENV.OTP_TTL_SECONDS, "second").toDate();

  await UserModel.findByIdAndUpdate(user._id, { otp, otpExpires });

  try {
    await sendMail({
      to: user.email,
      subject: "MindMirror reset OTP",
      text: `Your password reset OTP is ${otp}. It expires in ${ENV.OTP_TTL_SECONDS} seconds.`,
      html: `<p>Your password reset OTP is <strong>${otp}</strong>. It expires in ${ENV.OTP_TTL_SECONDS} seconds.</p>`,
    });
  } catch (e) {
    console.warn("Mailer failed while sending reset OTP:", e);
  }

  console.log(`[DEV] Reset OTP for ${user.email}: ${otp}`);
  return { message: "Reset OTP sent" };
}

/** Reset password using otp */
export async function resetPassword(tempUserId: string, otp: string, newPassword: string) {
  const user = await UserModel.findById(tempUserId).select("+otp +otpExpires");
  if (!user) throw new Error("User not found");
  if (!user.otp || !user.otpExpires) throw new Error("No OTP set");
  if (user.otp !== otp) throw new Error("Invalid OTP");
  if (user.otpExpires < new Date()) throw new Error("OTP expired");

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await UserModel.findByIdAndUpdate(user._id, { passwordHash, otp: undefined, otpExpires: undefined });
  return { message: "Password reset successful" };
}

/** Toggle plan */
export async function togglePlan(userId: string, plan: "free" | "premium") {
  const user = await UserModel.findByIdAndUpdate(userId, { plan }, { new: true });
  if (!user) throw new Error("User not found");
  return { plan: user.plan };
}
