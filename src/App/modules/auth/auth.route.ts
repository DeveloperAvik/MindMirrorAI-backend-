// src/App/modules/auth/auth.route.ts
import { Router } from "express";
import { register, verifyOtp, login, completeProfile } from "./auth.controller";
import passport from "../../Config/passport";

const router = Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);

// complete-profile requires auth
router.post("/complete-profile", passport.authenticate("jwt", { session: false }), completeProfile);

export default router;
