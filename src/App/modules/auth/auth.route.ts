import { Router } from "express";
import * as AuthController from "./auth.controller";
import { authLimiter, otpLimiter } from "../Middleware/rateLimit.middleware";

const router = Router();

router.post("/register", authLimiter, AuthController.register);
router.post("/resend-otp", otpLimiter, AuthController.resendOtp);
router.post("/verify-otp", otpLimiter, AuthController.verifyOtp);
router.post("/login", authLimiter, AuthController.login);
router.post("/refresh", authLimiter, AuthController.refreshToken);
router.post("/logout", authLimiter, AuthController.logout);
router.post("/forgot-password", otpLimiter, AuthController.forgotPassword);
router.post("/reset-password", otpLimiter, AuthController.resetPassword);

router.get("/oauth/google", AuthController.oauthGoogleInit());
router.get("/oauth/google/callback", AuthController.oauthGoogleCallback);
router.get("/oauth/github", AuthController.oauthGithubInit());
router.get("/oauth/github/callback", AuthController.oauthGithubCallback);

export default router;
