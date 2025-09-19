import { Document, Types } from "mongoose";
import { GenderEnum, OtpTypesEnum, ProviderEnum, RoleEnum } from "../Enums";
import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
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
  value: string;
  expiresAt: Date;
  otpType: OtpTypesEnum;
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
