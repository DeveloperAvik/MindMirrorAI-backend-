import mongoose, { Document, Schema } from "mongoose";

export type IDevice = Document & {
  user: mongoose.Types.ObjectId;
  ip: string;
  ua?: string;
  createdAt: Date;
};

const DeviceSchema = new Schema<IDevice>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ip: { type: String, required: true },
    ua: { type: String },
  },
  { timestamps: true }
);

const DeviceModel = mongoose.model<IDevice>("Device", DeviceSchema);
export default DeviceModel;
