import mongoose from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../Common/Enums";
import { IUser } from "../../Common/Interfaces";

const userSchema = new mongoose.Schema<IUser>(
  {
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
    bio: {
      type: String,
      default: "",
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
    twoFactorAuth: {
      enabled: {
        type: Boolean,
        default: false,
      },
      otp: {
        type: String,
        default: null,
      },
      otpExpiresAt: {
        type: Date,
        default: null,
      },
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
  },

  {
    timestamps: true,
  }
);

const UserModel = mongoose.model<IUser>("User", userSchema);

export { UserModel };
