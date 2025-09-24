import mongoose from "mongoose";
import { OtpTypesEnum } from "../../Common/Enums";


export interface IOtp {
  userId: mongoose.Types.ObjectId;
  value: string;
  otpType: OtpTypesEnum;
  expiresAt: Date;
}

const otpSchema = new mongoose.Schema<IOtp>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    value: { type: String, required: true },
    otpType: {
      type: String,
      enum: Object.values(OtpTypesEnum),
      required: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      index: { expires: "10m" }, // TTL Index
    },
  },
  { timestamps: true }
);

const OtpModel = mongoose.model<IOtp>("Otp", otpSchema);

export { OtpModel };
