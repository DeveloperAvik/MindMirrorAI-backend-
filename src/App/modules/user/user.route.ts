// src/App/modules/user/user.route.ts
import { Router } from "express";
import passport from "../../Config/passport";
import { Request, Response } from "express";
import * as AuthService from "../auth/auth.service";

const router = Router();

// Protected: toggle plan
router.post("/plan", passport.authenticate("jwt", { session: false }), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id.toString();
    const plan = (req.body.plan === "premium" ? "premium" : "free") as "free" | "premium";
    const out = await AuthService.togglePlan(userId, plan);
    return res.json(out);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// GET /api/v1/user/me
router.get("/me", passport.authenticate("jwt", { session: false }), async (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({ user });
});

export default router;
