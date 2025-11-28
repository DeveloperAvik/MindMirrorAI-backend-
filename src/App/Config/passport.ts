// src/App/Config/passport.ts
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { ENV } from "./env";
import UserModel from "../modules/user/user.model";
import jwt from "jsonwebtoken";

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: ENV.JWT_ACCESS_SECRET,
};

passport.use(new JwtStrategy(opts, async (payload, done) => {
  try {
    const user = await UserModel.findById(payload.sub).select("-passwordHash -otp -otpExpires");
    if (!user) return done(null, false);
    return done(null, user);
  } catch (err) {
    return done(err as any, false);
  }
}));

if (ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: ENV.GOOGLE_CLIENT_ID,
    clientSecret: ENV.GOOGLE_CLIENT_SECRET,
    callbackURL: ENV.GOOGLE_CALLBACK_URL,
  }, async (_, __, profile, done) => {
    try {
      const email = profile?.emails?.[0]?.value;
      let user = await UserModel.findOne({ email });
      if (!user) {
        user = await UserModel.create({
          email,
          name: profile.displayName,
          isActive: true,
          otp: null,
          otpExpires: null,
          plan: ENV.DEFAULT_USER_PLAN ?? "free",
        });
      }
      const token = jwt.sign({ sub: user._id.toString(), email: user.email }, ENV.JWT_ACCESS_SECRET, { expiresIn: ENV.JWT_ACCESS_EXPIRES });
      return done(null, { user, token });
    } catch (err) {
      return done(err);
    }
  }));
}

if (ENV.GITHUB_CLIENT_ID && ENV.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: ENV.GITHUB_CLIENT_ID,
    clientSecret: ENV.GITHUB_CLIENT_SECRET,
    callbackURL: ENV.GITHUB_CALLBACK_URL,
    scope: ["user:email"],
  }, async (_, __, profile, done) => {
    try {
      const email = profile?.emails?.[0]?.value;
      let user = await UserModel.findOne({ email });
      if (!user) {
        user = await UserModel.create({
          email,
          name: profile.displayName || profile.username,
          isActive: true,
          otp: null,
          otpExpires: null,
          plan: ENV.DEFAULT_USER_PLAN ?? "free",
        });
      }
      const token = jwt.sign({ sub: user._id.toString(), email: user.email }, ENV.JWT_ACCESS_SECRET, { expiresIn: ENV.JWT_ACCESS_EXPIRES });
      return done(null, { user, token });
    } catch (err) {
      return done(err);
    }
  }));
}

export default passport;
