import { Request, Response } from "express";
import { BadRequestException } from "../../../Utils/Errors/exceptions.utils";
import { S3ClientService } from "../../../Utils";
import { IRequest } from "../../../Common/Interfaces";
import { SuccessResponse } from "../../../Utils/Response/response-helper.utils";
import { UserRepository } from "../../../DB/Repositories";
import { UserModel } from "../../../DB/Models";
import mongoose from "mongoose";

export class ProfileService {
  private s3Client = new S3ClientService();
  private userRepo = new UserRepository(UserModel);

  uploadProfilePicture = async (req: Request, res: Response) => {
    const { file } = req;
    const { user } = (req as unknown as IRequest).loggedInUser;
    if (!file) throw new BadRequestException("Please Upload A File");

    const { key, url } = await this.s3Client.uploadFileOnS3(
      file,
      `${user._id}/profile`
    );

    user.profilePicture = key;
    await user.save();

    res.json(
      SuccessResponse<unknown>("Profile Picture Uploaded Successfully", 200, {
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
}

export default new ProfileService();
