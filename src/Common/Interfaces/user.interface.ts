import mongoose, { Document, Types } from "mongoose";
import {
  FriendShipStatusEnum,
  GenderEnum,
  OtpTypesEnum,
  ProviderEnum,
  RoleEnum,
} from "../Enums";
import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  bio: string;
  email: string;
  twoFactorAuth: {
    enabled: boolean;
    otp: string;
    otpExpiresAt: Date;
  };
  password: string;
  role: RoleEnum;
  gender: GenderEnum;
  DOB?: Date;
  profilePicture?: string;
  coverPicture?: string;
  provider: ProviderEnum;
  googleId?: string;
  phoneNumber?: string;
  isVerified?: boolean;
  age?: number;
  OTPS: IOTP[];
}

export interface IEmailArgument {
  to: string;
  cc?: string;
  subject: string;
  content: string;
  attachments?: string[];
}

export interface IOTP {
  userId: mongoose.Types.ObjectId;
  value: string;
  otpType: OtpTypesEnum;
  expiresAt: Date;
}

export interface ITokenPayload {
  _id: string;
  role: RoleEnum;
  email: string;
  isVerified?: boolean;
  jti?: boolean;
}

export interface IRequest extends Request {
  loggedInUser: { user: IUser; token: JwtPayload };
}

export interface IBlackListedToken extends Document {
  tokenId: string;
  expiresAt: Date;
}

export interface IFriendShip extends Document {
  requstFromId: mongoose.Types.ObjectId;
  requstToId: mongoose.Types.ObjectId;
  status: FriendShipStatusEnum;
}
