import { NextFunction, Request, Response } from "express";
import { IOTP, IRequest, IUser } from "../../../Common/Interfaces";
import { UserRepository } from "../../../DB/Repositories/user.repository";
import { BlackListedTokenModel, UserModel } from "../../../DB/Models";
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
import { BlackListedTokenRepository } from "../../../DB/Repositories";
import { SuccessResponse } from "../../../Utils/Response/response-helper.utils";
import { OtpModel } from "../../../DB/Models/otp.model";
import {
  BadRequestException,
  NotFoundException,
} from "../../../Utils/Errors/exceptions.utils";

const uniqueString = customAlphabet("0123456789", 5);

class AuthService {
  private userRepo: UserRepository = new UserRepository(UserModel);
  private blackListedRepo: BlackListedTokenRepository =
    new BlackListedTokenRepository(BlackListedTokenModel);

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
    } = req.body;

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

    // Execute The User Age
    if (DOB) {
      const birthDate = new Date(DOB as unknown as string);
      const today = new Date();

      let userAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        userAge--; // If the user's birthday hasn't occurred yet this year, subtract 1 from age
      }
    }

    // Encrypt Phone Number And Hash Password
    const encryptedPhoneNumber = encrypt(phoneNumber as string);
    const hashedPassword = generateHash(password as string);

    // Create New User
    const newUser = await this.userRepo.createNewDocument({
      firstName,
      lastName,
      password: hashedPassword,
      email,
      gender,
      age,
      phoneNumber: encryptedPhoneNumber,
    });

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
      userId: newUser._id,
      value: generateHash(otp),
      otpType: OtpTypesEnum.EMAIL_VERIFICATION,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };
    await OtpModel.create(confermitionEmailOtp);

    return res
      .status(201)
      .json(
        SuccessResponse<IUser>("User Signed Up Successfully", 201, newUser)
      );
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
        _id: user._id.toString(),
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
        _id: user._id.toString(),
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

    // Find the user by email
    const user = await this.userRepo.findUserByEmail(email);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Email Not Found" });
    }

    // Find the latest OTP for this user with type EMAIL_VERIFICATION
    const otpDoc = await OtpModel.findOne({
      userId: user._id,
      otpType: OtpTypesEnum.EMAIL_VERIFICATION,
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({ success: false, message: "No OTP found" });
    }

    // Check if the OTP is expired
    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // Compare the provided OTP with the stored hashed OTP
    const isOtpMatches = await compareHash(otp, otpDoc.value);
    if (!isOtpMatches) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Mark the user as verified
    user.isVerified = true;
    await user.save();

    // Delete all OTPs for this user and type EMAIL_VERIFICATION
    await OtpModel.deleteMany({
      userId: user._id,
      otpType: OtpTypesEnum.EMAIL_VERIFICATION,
    });

    return res
      .status(200)
      .json({ success: true, message: "Account Confirmed Successfully" });
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    const {
      token: { jti: accessTokenId, exp: accessTokenExp },
    } = (req as IRequest).loggedInUser;

    const { jti: refreshTokenId, exp: refreshTokenExp } = (req as any)
      .refreshToken;

    // Revoke Access Token
    const blackListedAccessToken = await this.blackListedRepo.createNewDocument(
      {
        tokenId: accessTokenId,
        expiresAt: new Date(accessTokenExp || Date.now() + 600000),
      }
    );

    // Revoke Refresh Token
    const blackListedRefreshToken =
      await this.blackListedRepo.createNewDocument({
        tokenId: refreshTokenId,
        expiresAt: new Date(refreshTokenExp || Date.now() + 600000),
      });

    return res.status(200).json({
      success: true,
      message: "User Logged Out Successfully",
      data: { blackListedAccessToken, blackListedRefreshToken },
    });
  };

  refreshToken = async (req: Request, res: Response) => {
    const decodedData = (req as any).refreshToken;

    // Create New Access Token
    const accessToken = generateToken(
      {
        _id: decodedData._id,
        role: decodedData.role,
        email: decodedData.email,
        isVerified: decodedData.isVerified,
      },
      process.env.JWT_ACCESS_SECRET as string,
      {
        jwtid: uuidv4(),
        expiresIn: process.env
          .JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
      }
    );

    // Create New Refresh Token (rotation)
    const newRefreshToken = generateToken(
      {
        _id: decodedData._id,
        role: decodedData.role,
        email: decodedData.email,
        isVerified: decodedData.isVerified,
      },
      process.env.JWT_REFRESH_SECRET as string,
      {
        jwtid: uuidv4(),
        expiresIn: process.env
          .JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
      }
    );

    res.json(
      SuccessResponse("Access Token Refreshed Successfully", 200, {
        accessToken,
        refreshToken: newRefreshToken,
      })
    );
  };

  // Forget Password  
  forgetPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await this.userRepo.findUserByEmail(email);
    if (!user) throw new NotFoundException("User Not Found");

    // Generate OTP
    const otp = uniqueString();
    emmiter.emit("sendEmail", {
      to: email,
      subject: "Reset Your Password - OTP Verification",
      content: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; background-color: #fafafa;">
    <h2 style="text-align: center; color: #FF9800;">🔑 Password Reset Request</h2>
    <p style="font-size: 16px; color: #333;">
      Hello <b>${user.firstName}</b>,
    </p>
    <p style="font-size: 15px; color: #333;">
      We received a request to reset your password. Please use the following OTP to verify your identity and reset your password:
    </p>
    
    <div style="text-align: center; margin: 20px 0;">
      <span style="display: inline-block; background: #FF9800; color: white; font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 12px 24px; border-radius: 8px;">
        ${otp}
      </span>
    </div>

    <p style="font-size: 14px; color: #555;">
      ⚠️ This OTP will expire in <b>10 minutes</b>. Do not share it with anyone.
    </p>

    <p style="font-size: 14px; color: #777;">
      If you did not request a password reset, you can safely ignore this email — your account will remain secure.
    </p>

    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
    <p style="text-align: center; font-size: 12px; color: #aaa;">
      © ${new Date().getFullYear()} Social Media App. All rights reserved.
    </p>
  </div>
  `,
    });

    // Store Hashed OTP In DB
    const resetPasswordOtp: IOTP = {
      userId: user._id,
      otpType: OtpTypesEnum.FORGOT_PASSWORD,
      value: generateHash(otp),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };
    await OtpModel.create(resetPasswordOtp);

    return res.json(
      SuccessResponse("Reset Password OTP Send Successfully To Your Email", 200)
    );
  };

  // Reset Password
  resetPassword = async (req: Request, res: Response) => {
    const { otp, email, newPassword } = req.body;

    const user = await this.userRepo.findUserByEmail(email);
    if (!user) throw new NotFoundException("User Not Found");
    const userOtps = await OtpModel.findOne({ userId: user._id });

    // Compare OTPs
    const isOtpMatches = compareHash(otp, userOtps?.value!);
    if (!isOtpMatches) throw new BadRequestException("Invalid OTP");
    // Delete Reset Password OTPs For This User
    await OtpModel.deleteMany({
      userId: user._id,
      otpType: OtpTypesEnum.FORGOT_PASSWORD,
    });

    // Replace Old Pass With New Pass
    const hashedPassword = generateHash(newPassword);
    user.password = hashedPassword;
    await user.save();

    return res.json(SuccessResponse("User Password Changed Successfully", 200));
  };
}

export default new AuthService();
