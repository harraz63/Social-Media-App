import mongoose from "mongoose";
import {
  GenderEnum,
  OtpTypesEnum,
  ProviderEnum,
  RoleEnum,
} from "../../Common/Enums";
import { IUser } from "../../Common/Interfaces";

const OtpSchema = new mongoose.Schema(
  {
    value: { type: String, required: true },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000),
      index: { expires: "10m" }, // Auto Delete After 10 Mins
    },
    otpType: {
      type: String,
      enum: Object.values(OtpTypesEnum),
      default: OtpTypesEnum.EMAIL_VERIFICATION,
      required: true,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema<IUser>({
  firstName: {
    type: String,
    required: true,
    minLength: [4, "First Name Must Be At Least 4 Characters Long"],
  },
  lastName: {
    type: String,
    required: true,
    minLength: [4, "Last Name Must Be At Least 4 Characters Long"],
  },
  email: {
    type: String,
    required: true,
    index: {
      unique: true,
      name: "idx_email_unique",
    },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
  },
  role: {
    type: String,
    enum: RoleEnum,
    default: RoleEnum.USER,
  },
  gender: {
    type: String,
    enum: GenderEnum,
    default: GenderEnum.OTHER,
  },
  DOB: {
    type: Date,
  },
  profilePicture: String,
  coverPicture: String,
  provider: {
    type: String,
    enum: ProviderEnum,
    default: ProviderEnum.LOCAL,
  },
  googleId: String,
  phoneNumber: String,
  OTPS: [OtpSchema],
});

const UserModel = mongoose.model<IUser>("User", userSchema);

export { UserModel };
