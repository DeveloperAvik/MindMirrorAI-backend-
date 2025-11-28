// src/App/modules/scan/scan.model.ts
import mongoose, { Document, Schema } from "mongoose";

export type IScan = Document & {
  user: mongoose.Types.ObjectId;
  imagePath?: string | null;
  audioPath?: string | null;
  mlResult: any;
  wellnessScore: number;
  createdAt: Date;
};

const ScanSchema = new Schema<IScan>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    imagePath: { type: String },
    audioPath: { type: String },
    mlResult: { type: Schema.Types.Mixed, default: {} },
    wellnessScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ScanModel = mongoose.model<IScan>("Scan", ScanSchema);
export default ScanModel;
