import { NextFunction, Request, Response } from "express";
import { IOTP, IUser } from "../../../Common/Interfaces";
import { UserRepository } from "../../../DB/Repositories/user.repository";
import { UserModel } from "../../../DB/Models";
import {
  compareHash,
  emmiter,
  encrypt,
  generateHash,
  generateToken,
} from "../../../Utils";
import { customAlphabet } from "nanoid";
import { OtpTypesEnum } from "../../../Common/Enums";
import { SignOptions } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const uniqueString = customAlphabet("0123456789", 5);

class AuthService {
  private userRepo: UserRepository = new UserRepository(UserModel);

  signup = async (req: Request, res: Response, next: NextFunction) => {
    const {
      firstName,
      lastName,
      password,
      email,
      gender,
      DOB,
      age,
      phoneNumber,
    }: Partial<IUser> = req.body;

    // Check If Email Is Already Exist
    const isEmailExist = await this.userRepo.findOneDocument(
      { email },
      "email"
    );
    if (isEmailExist) {
      return res.status(409).json({
        success: false,
        message: "Email Already Exist",
        data: {
          invalidEmail: email,
        },
      });
    }

    // Encrypt Phone Number And Hash Password
    const encryptedPhoneNumber = encrypt(phoneNumber as string);
    const hashedPassword = generateHash(password as string);

    // OTP Logic And Sending Confirmation Email
    const otp = uniqueString();
    emmiter.emit("sendEmail", {
      to: email,
      subject: "Verify Your Email - OTP for Signup",
      content: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; background-color: #fafafa;">
    <h2 style="text-align: center; color: #4CAF50;">🔐 Email Verification</h2>
    <p style="font-size: 16px; color: #333;">
      Hello <b>${firstName}</b>,
    </p>
    <p style="font-size: 15px; color: #333;">
      Thank you for signing up! Please use the following OTP to complete your registration:
    </p>
    
    <div style="text-align: center; margin: 20px 0;">
      <span style="display: inline-block; background: #4CAF50; color: white; font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 12px 24px; border-radius: 8px;">
        ${otp}
      </span>
    </div>

    <p style="font-size: 14px; color: #555;">
      ⚠️ This OTP will expire in <b>10 minutes</b>. Do not share it with anyone.
    </p>

    <p style="font-size: 14px; color: #777;">
      If you did not request this, please ignore this email.
    </p>

    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
    <p style="text-align: center; font-size: 12px; color: #aaa;">
      © ${new Date().getFullYear()} Social Media App. All rights reserved.
    </p>
  </div>
  `,
    });

    const confermitionEmailOtp: IOTP = {
      value: generateHash(otp),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      otpType: OtpTypesEnum.EMAIL_VERIFICATION,
    };

    // Create New User
    const newUser = await this.userRepo.createNewDocument({
      firstName,
      lastName,
      password: hashedPassword,
      email,
      gender,
      DOB,
      age,
      phoneNumber: encryptedPhoneNumber,
      OTPS: [confermitionEmailOtp],
    });

    return res.status(201).json({
      success: true,
      message: "User Signed Up Successfully",
      data: {
        firstName,
        lastName,
        email,
        gender,
        DOB,
        age,
      },
    });
  };

  signin = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: Partial<IUser> = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email Is Required" });
    }

    // Get The User By Email
    const user = await this.userRepo.findUserByEmail(email as string);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid Email Or Password" });
    }
    // Password Checks
    const isPasswordMatches = compareHash(
      password as string,
      user?.password as string
    );
    if (!isPasswordMatches) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email Or Password" });
    }

    // Generate Access And Refresh Tokens
    const accessToken = generateToken(
      {
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
        isVerified: user.isVerified,
      },
      process.env.JWT_ACCESS_SECRET as string,
      {
        jwtid: uuidv4(),
        expiresIn: process.env
          .JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
      }
    );
    const refreshToken = generateToken(
      {
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
        isVerified: user.isVerified,
      },
      process.env.JWT_REFRESH_SECRET as string,
      {
        jwtid: uuidv4(),
        expiresIn: process.env
          .JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
      }
    );

    return res.status(200).json({
      success: true,
      message: "User Logged In Successfully",
      accessToken,
      refreshToken,
    });
  };

  confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });
    }

    // Validate On Otp
    const user = await this.userRepo.findUserByEmail(email);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Email Not Found" });
    }

    // Check If User Have Not OTP
    if (!user.OTPS.length) {
      return res.status(400).json({ success: false, message: "No OTP found" });
    }

    // Compare OTPS
    const userOtp = user.OTPS[user.OTPS.length - 1];
    // Check If OTP Is Expired
    if (userOtp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    const isOtpMatches = await compareHash(otp, userOtp.value);
    if (!isOtpMatches) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    user.OTPS = [];
    user.isVerified = true;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Account Confirmed Successfully" });
  };
}

export default new AuthService();
