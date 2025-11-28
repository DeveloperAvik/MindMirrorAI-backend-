// src/App/modules/user/user.model.ts
import mongoose, { Document, Schema } from "mongoose";

export type IUser = Document & {
  email: string;
  passwordHash?: string;
  name?: string;
  dob?: Date | null;
  consent?: boolean;
  isActive: boolean;
  otp?: string | null;
  otpExpires?: Date | null;
  plan: "free" | "premium";
  streakCount: number;
  lastScanAt?: Date | null;
  badges: string[]; // badge ids or names
  createdAt: Date;
  updatedAt: Date;
};

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String },
    name: { type: String },
    dob: { type: Date },
    consent: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    plan: { type: String, enum: ["free", "premium"], default: "free" },
    streakCount: { type: Number, default: 0 },
    lastScanAt: { type: Date, default: null },
    badges: { type: [String], default: [] },
  },
  { timestamps: true }
);

const UserModel = mongoose.model<IUser>("User", UserSchema);
export default UserModel;
