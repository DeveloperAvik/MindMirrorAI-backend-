// src/App/modules/auth/auth.controller.ts
import { Request, Response } from "express";
import * as AuthService from "./auth.service";
import { z } from "zod";
import passport from "../../Config/passport";

const registerSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
const verifySchema = z.object({ tempUserId: z.string(), otp: z.string().length(6) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
const resendSchema = z.object({ tempUserId: z.string() });
const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({ tempUserId: z.string(), otp: z.string().length(6), newPassword: z.string().min(8) });
const refreshSchema = z.object({ refreshToken: z.string() });

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  try { const out = await AuthService.registerStep1(parsed.data.email, parsed.data.password); return res.status(201).json(out); }
  catch (e: any) { return res.status(400).json({ error: e.message }); }
}

export async function resendOtp(req: Request, res: Response) {
  const parsed = resendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  try { const out = await AuthService.resendOtp(parsed.data.tempUserId); return res.json(out); }
  catch (e: any) { return res.status(400).json({ error: e.message }); }
}

export async function verifyOtp(req: Request, res: Response) {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  try { const out = await AuthService.verifyOtpAndActivate(parsed.data.tempUserId, parsed.data.otp); return res.json(out); }
  catch (e: any) { return res.status(400).json({ error: e.message }); }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  try {
    const ip = (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress;
    const ua = req.headers["user-agent"] as string | undefined;
    const out = await AuthService.login(parsed.data.email, parsed.data.password, ip as string, ua);
    return res.json(out);
  } catch (e: any) { return res.status(400).json({ error: e.message }); }
}

export async function refreshToken(req: Request, res: Response) {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  try { const out = await AuthService.refreshAccessToken(parsed.data.refreshToken); return res.json(out); }
  catch (e: any) { return res.status(400).json({ error: e.message }); }
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: "Missing refreshToken" });
  try { const out = await AuthService.logout(refreshToken); return res.json(out); }
  catch (e: any) { return res.status(400).json({ error: e.message }); }
}

export async function forgotPassword(req: Request, res: Response) {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  try { const out = await AuthService.forgotPassword(parsed.data.email); return res.json(out); }
  catch (e: any) { return res.status(400).json({ error: e.message }); }
}

export async function resetPassword(req: Request, res: Response) {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  try { const out = await AuthService.resetPassword(parsed.data.tempUserId, parsed.data.otp, parsed.data.newPassword); return res.json(out); }
  catch (e: any) { return res.status(400).json({ error: e.message }); }
}

/** OAuth endpoints */
export function oauthGoogleInit() { return passport.authenticate("google", { scope: ["profile", "email"] }); }
export function oauthGoogleCallback(req: any, res: any) {
  passport.authenticate("google", { session: false }, (err: any, data: any) => {
    if (err) return res.status(500).json({ error: err.message });
    const token = data?.token;
    return res.redirect(`${process.env.OAUTH_REDIRECT_URL || "http://localhost:5173"}/oauth?token=${token}`);
  })(req, res);
}
export function oauthGithubInit() { return passport.authenticate("github", { scope: ["user:email"] }); }
export function oauthGithubCallback(req: any, res: any) {
  passport.authenticate("github", { session: false }, (err: any, data: any) => {
    if (err) return res.status(500).json({ error: err.message });
    const token = data?.token;
    return res.redirect(`${process.env.OAUTH_REDIRECT_URL || "http://localhost:5173"}/oauth?token=${token}`);
  })(req, res);
}
