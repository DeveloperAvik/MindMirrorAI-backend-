// src/App/modules/auth/auth.controller.ts
import { Request, Response } from "express";
import * as AuthService from "./auth.service";
import UserModel from "../user/user.model";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const verifySchema = z.object({
  tempUserId: z.string(),
  otp: z.string().length(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const completeProfileSchema = z.object({
  name: z.string().min(2).optional(),
  dob: z.string().optional(),
  consent: z.boolean().optional(),
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  try {
    const out = await AuthService.registerStep1(parsed.data.email, parsed.data.password);
    return res.status(201).json(out);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function verifyOtp(req: Request, res: Response) {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  try {
    const out = await AuthService.verifyOtpAndActivate(parsed.data.tempUserId, parsed.data.otp);
    return res.json(out);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  try {
    const out = await AuthService.login(parsed.data.email, parsed.data.password);
    return res.json(out);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function completeProfile(req: Request, res: Response) {
  const parsed = completeProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

  const userId = (req as any).user?._id?.toString();
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const update: any = {};
  if (parsed.data.name) update.name = parsed.data.name;
  if (parsed.data.dob) update.dob = new Date(parsed.data.dob);
  if (typeof parsed.data.consent !== "undefined") update.consent = parsed.data.consent;

  const user = await UserModel.findByIdAndUpdate(userId, update, { new: true }).select("-passwordHash");
  return res.json({ user });
}
