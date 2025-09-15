import { Document, Types } from "mongoose";
import { GenderEnum, OtpTypesEnum, ProviderEnum, RoleEnum } from "../Enums";

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
  userId: string;
  role: RoleEnum;
  email: string;
  isVerified?: boolean;
}
