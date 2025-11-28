// src/App/modules/auth/refresh.model.ts
import mongoose, { Document, Schema } from "mongoose";

export type IRefresh = Document & {
  user: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
};

const RefreshSchema = new Schema<IRefresh>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model<IRefresh>("RefreshToken", RefreshSchema);
