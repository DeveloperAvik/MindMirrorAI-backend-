// src/App/Middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import passport from "../../Config/passport";
import { verifyAccessToken } from "../../Utils/token";
import UserModel from "../../modules/user/user.model";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization as string | undefined;
  if (!h || !h.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = h.slice(7);
  try {
    const payload: any = verifyAccessToken(token) as any;
    // attach user
    const user = await UserModel.findById(payload.sub).select("-passwordHash -otp -otpExpires");
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    (req as any).user = user;
    next();
  } catch (e: any) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
