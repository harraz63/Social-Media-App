import { Request, Response } from "express";
import {
  BadRequestException,
  NotFoundException,
} from "../../../Utils/Errors/exceptions.utils";
import {
  compareHash,
  decrypt,
  emmiter,
  generateHash,
  S3ClientService,
} from "../../../Utils";
import { IFriendShip, IRequest, IUser } from "../../../Common/Interfaces";
import { SuccessResponse } from "../../../Utils/Response/response-helper.utils";
import { FriendShipRepository, UserRepository } from "../../../DB/Repositories";
import { UserModel } from "../../../DB/Models";
import { FriendShipStatusEnum } from "../../../Common/Enums";
import { FilterQuery } from "mongoose";
import { customAlphabet } from "nanoid";

const uniqueString = customAlphabet("0123456789", 5);

export class ProfileService {
  private s3Client = new S3ClientService();
  private userRepo = new UserRepository(UserModel);
  private friendShipRepo = new FriendShipRepository();

  uploadProfilePicture = async (req: Request, res: Response) => {
    const { file } = req;
    const { user } = (req as unknown as IRequest).loggedInUser;
    if (!file) throw new BadRequestException("Please Upload A File");

    // Optional: remove old profile picture
    if (user.profilePicture) {
      await this.s3Client.deleteFileFromS3(user.profilePicture);
    }

    const { key, url } = await this.s3Client.uploadFileOnS3(
      file,
      `${user._id}/profile`
    );

    user.profilePicture = key;
    await user.save();

    res.json(
      SuccessResponse("Profile Picture Uploaded Successfully", 200, {
        key,
        url,
      })
    );
  };

  uploadCoverPicture = async (req: Request, res: Response) => {
    const file = req.file;
    const { user } = (req as unknown as IRequest).loggedInUser;
    if (!file) throw new BadRequestException("Please Upload The File");

    const { key, url } = await this.s3Client.uploadFileOnS3(
      file,
      `${user._id}/cover`
    );

    user.coverPicture = key;
    await user.save();

    res.json(
      SuccessResponse("Cover Picture Uploaded Successfully", 200, {
        key,
        url,
      })
    );
  };

  renewSignedUrl = async (req: Request, res: Response) => {
    const { user } = (req as unknown as IRequest).loggedInUser;
    const {
      key,
      keyType,
    }: { key: string; keyType: "profilePicture" | "coverPicture" } = req.body;

    if (user[keyType] !== key) {
      throw new BadRequestException("Invalid Key");
    }

    const url = await this.s3Client.getFileWithSignedUrl(key);

    res.json(
      SuccessResponse<unknown>("Signed URL Renewed Successfully", 200, {
        key,
        url,
      })
    );
  };

  deleteAccount = async (req: Request, res: Response) => {
    const { user } = (req as unknown as IRequest).loggedInUser;

    // Get User
    const userDocument = await this.userRepo.findDocumentById(user._id);
    if (!userDocument) {
      throw new BadRequestException("User Not Found");
    }

    // Delete Profile Picture From S3
    let deletedProfileResponse = null;
    if (userDocument.profilePicture) {
      deletedProfileResponse = await this.s3Client.deleteFileFromS3(
        userDocument.profilePicture
      );
    }

    // Delete Cover Picture From S3
    let deletedCoverResponse = null;
    if (userDocument.coverPicture) {
      deletedCoverResponse = await this.s3Client.deleteFileFromS3(
        userDocument.coverPicture
      );
    }

    // Delete User Document
    await this.userRepo.deleteByIdDocument(user._id);

    res.json(
      SuccessResponse<unknown>("Account Deleted Successfully", 200, {
        deletedProfileResponse,
        deletedCoverResponse,
      })
    );
  };

  // Send Friend Request
  sendFriendShipRequest = async (req: Request, res: Response) => {
    const {
      user: { _id: userId },
    } = (req as unknown as IRequest).loggedInUser;
    const { friendId } = req.body;

    const user = await this.userRepo.findDocumentById(friendId);
    if (!user) throw new BadRequestException("User Not Found");

    await this.friendShipRepo.createNewDocument({
      requstFromId: userId,
      requstToId: friendId,
    });

    return res.json(
      SuccessResponse("Friend Ship Request Sent Successfully", 200)
    );
  };

  // List Friend Requests
  listRequests = async (req: Request, res: Response) => {
    const {
      user: { _id: userId },
    } = (req as IRequest).loggedInUser;
    const { status } = req.query;

    const filters: FilterQuery<IFriendShip> = {
      status: status ? status : FriendShipStatusEnum.PENDING,
    };
    if (filters.status === FriendShipStatusEnum.ACCEPTED) {
      filters.$or = [{ requstToId: userId }, { requstFromId: userId }];
    } else {
      filters.requstToId = userId;
    }

    const frindShipRequests = await this.friendShipRepo.findDocuments(
      filters,
      undefined,
      {
        populate: [
          {
            path: "requstFromId",
            select: "firstName lastName profilePicture",
          },
          {
            path: "requstToId",
            select: "firstName lastName profilePicture",
          },
        ],
      }
    );

    return res.json(
      SuccessResponse<IFriendShip[]>(
        "Requests Fetched Successfully",
        200,
        frindShipRequests
      )
    );
  };

  // Response Friend Request
  respondToFriendShipRequest = async (req: Request, res: Response) => {
    const {
      user: { _id: userId },
    } = (req as IRequest).loggedInUser;
    const { friendRequestId, response } = req.body;

    // Get The Friend Ship Request
    const friendRequest = await this.friendShipRepo.findOneDocument({
      _id: friendRequestId,
      requstToId: userId,
      status: FriendShipStatusEnum.PENDING,
    });
    if (!friendRequest)
      throw new BadRequestException("Friend Request Not Found");

    friendRequest.status = response;
    await friendRequest.save();

    return res.json(
      SuccessResponse<IFriendShip>(
        "Friend Ship Request Responded Successfully",
        200,
        friendRequest
      )
    );
  };

  // Get My Data
  getMyData = async (req: Request, res: Response) => {
    const {
      user: { _id: userId },
    } = (req as IRequest).loggedInUser;

    // Get User Data
    const user = await this.userRepo.findDocumentById(userId);
    if (!user) throw new NotFoundException("User Not Found");

    const safeUser = {
      ...user.toObject(),
      password: undefined,
      phoneNumber: decrypt(user.phoneNumber as string),
    };

    return res.json(
      SuccessResponse("User Data Fetched Successfully", 200, safeUser)
    );
  };

  // Update Profile Data
  updateProfileData = async (req: Request, res: Response) => {
    const {
      user: { _id: userId },
    } = (req as IRequest).loggedInUser;
    const { firstName, lastName, bio, phoneNumber }: IUser = req.body;

    const user = await this.userRepo.findDocumentById(userId);
    if (!user) throw new NotFoundException("User Not Found");

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio) user.bio = bio;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    await user.save();

    const safeUser = {
      ...user.toObject(),
      password: undefined,
      phoneNumber: decrypt(user.phoneNumber as string),
    };

    return res.json(
      SuccessResponse("User Data Updated Successfully", 200, safeUser)
    );
  };

  // Change Email
  changeEmail = async (req: Request, res: Response) => {
    const {
      user: { _id: userId },
    } = (req as IRequest).loggedInUser;
    const { email }: IUser = req.body;

    const user = await this.userRepo.findDocumentById(userId);
    if (!user) throw new NotFoundException("User Not Found");

    user.email = email;
    await user.save();

    const safeUser = {
      ...user.toObject(),
      password: undefined,
      phoneNumber: decrypt(user.phoneNumber as string),
    };

    return res.json(
      SuccessResponse("User Data Updated Successfully", 200, safeUser)
    );
  };

  // Enable 2fa
  enable2FA = async (req: Request, res: Response) => {
    const {
      user: { _id: userId },
    } = (req as IRequest).loggedInUser;

    const user = await this.userRepo.findDocumentById(userId);
    if (!user) throw new NotFoundException("User Not Found");

    // Send Otp To Enaple 2FA
    const otp = uniqueString();
    user.twoFactorAuth.enabled = true;
    user.twoFactorAuth.otp = generateHash(otp);
    user.twoFactorAuth.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    emmiter.emit("sendEmail", {
      to: user.email,
      subject:
        "🔐 Enable Two-Factor Authentication (2FA) - Your Verification Code",
      content: `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f8fafc;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #2563EB; margin-bottom: 10px;">🔐 Enable Two-Factor Authentication</h2>
      <p style="font-size: 15px; color: #374151; margin: 0;">
        Hello <b>${user.firstName}</b>,
      </p>
    </div>

    <p style="font-size: 15px; color: #374151; line-height: 1.6;">
      To complete the process of <b>enabling Two-Factor Authentication (2FA)</b> on your account, please enter the following
      <b>One-Time Passcode (OTP)</b> in the app:
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <span style="display: inline-block; background: #2563EB; color: #fff; font-size: 26px; font-weight: bold; letter-spacing: 6px; padding: 14px 28px; border-radius: 10px;">
        ${otp}
      </span>
    </div>

    <p style="font-size: 14px; color: #555; line-height: 1.6;">
      ⚠️ This OTP will expire in <b>10 minutes</b>. Do not share it with anyone.
    </p>

    <p style="font-size: 14px; color: #777; line-height: 1.6;">
      Once confirmed, 2FA will be activated on your account for extra protection. You'll be asked to enter an OTP each time you log in.
    </p>

    <div style="background-color: #2563EB; color: #fff; border-radius: 10px; padding: 16px; text-align: center; margin: 24px 0;">
      <h3 style="margin: 0; font-size: 20px;">Keep this code private 🔒</h3>
    </div>

    <p style="font-size: 13px; color: #999; text-align: center; margin-top: 20px;">
      If you did not request to enable 2FA, please ignore this email or contact support immediately.
    </p>

    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

    <p style="text-align: center; font-size: 12px; color: #9ca3af;">
      © ${new Date().getFullYear()} Social Media App. All rights reserved.<br/>
      Security powered by Social Media App.
    </p>
  </div>
  `,
    });

    return res.json(
      SuccessResponse(
        "Two-Factor Authentication OTP Send To Your Email Successfully",
        200
      )
    );
  };

  // Disable 2FA
  disable2FA = async (req: Request, res: Response) => {
    const {
      user: { _id: userId },
    } = (req as IRequest).loggedInUser;

    const user = await this.userRepo.findDocumentById(userId);
    if (!user) throw new NotFoundException("User Not Found");

    // Disable 2FA
    user.twoFactorAuth.enabled = false;
    user.twoFactorAuth.otp = "";
    user.twoFactorAuth.otpExpiresAt = new Date();
    await user.save();

    emmiter.emit("sendEmail", {
      to: user.email,
      subject: "Two-Factor Authentication Disabled Successfully",
      content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; background-color: #f9fafb;">
        <h2 style="text-align: center; color: #DC2626;">🚫 Two-Factor Authentication Disabled</h2>
    
        <p style="font-size: 16px; color: #333;">
          Hello <b>${user.firstName}</b>,
        </p>
    
        <p style="font-size: 15px; color: #333;">
          We wanted to let you know that Two-Factor Authentication (2FA) has been <b>disabled</b> for your account.
        </p>
    
        <p style="font-size: 14px; color: #555;">
          ⚠️ Your account is now protected only by your password. For better security, we recommend keeping 2FA enabled.
        </p>
    
        <p style="font-size: 14px; color: #555;">
          If you didn’t disable 2FA yourself, please secure your account immediately by resetting your password and re-enabling 2FA.
        </p>
    
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
    
        <p style="text-align: center; font-size: 12px; color: #aaa;">
          © ${new Date().getFullYear()} Social Media App. All rights reserved.
        </p>
      </div>
      `,
    });

    return res.json(
      SuccessResponse("Two-Factor Authentication Disabled Successfully", 200)
    );
  };

  // Verify 2FA
  verify2FA = async (req: Request, res: Response) => {
    const {
      user: { _id: userId },
    } = (req as IRequest).loggedInUser;
    const { otp } = req.body;

    const user = await this.userRepo.findDocumentById(userId);
    if (!user) throw new NotFoundException("User Not Found");

    // Compare OTPS;
    const isOtpMatches = compareHash(otp, user.twoFactorAuth.otp);
    if (!isOtpMatches) throw new BadRequestException("Invalid OTP");

    // If It Matches
    user.twoFactorAuth.enabled = true;
    user.twoFactorAuth.otp = "";
    user.twoFactorAuth.otpExpiresAt = new Date();
    await user.save();

    emmiter.emit("sendEmail", {
      to: user.email,
      subject: "Two-Factor Authentication Enabled Successfully",
      content: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; background-color: #f9fafb;">
    <h2 style="text-align: center; color: #16A34A;">✅ Two-Factor Authentication Enabled</h2>

    <p style="font-size: 16px; color: #333;">
      Hello <b>${user.firstName}</b>,
    </p>

    <p style="font-size: 15px; color: #333;">
      Great news! Two-Factor Authentication (2FA) has been <b>successfully enabled</b> for your account.
    </p>

    <p style="font-size: 14px; color: #555;">
      From now on, whenever you sign in, you’ll need to enter a verification code sent to your registered email address to confirm it’s really you.
    </p>

    <p style="font-size: 14px; color: #555;">
      🔐 This extra layer of security helps protect your account from unauthorized access — even if someone gets your password.
    </p>

    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />

    <p style="text-align: center; font-size: 12px; color: #aaa;">
      © ${new Date().getFullYear()} Social Media App. All rights reserved.
    </p>
  </div>
  `,
    });

    return res.json(
      SuccessResponse("Two-Factor Authentication Enabled Successfully", 200)
    );
  };
}

export default new ProfileService();
