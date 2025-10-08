import { JwtPayload } from "jsonwebtoken";
import { NextFunction, Response, Request } from "express";

import { HttpException, verifyToken } from "../Utils";
import { IRequest, IUser } from "../Common/Interfaces";
import { BlackListedTokenModel, UserModel } from "../DB/Models";
import { BlackListedTokenRepository, UserRepository } from "../DB/Repositories";
import { BadRequestException } from "../Utils/Errors/exceptions.utils";

const userRepo = new UserRepository(UserModel);
const blackListedRepo = new BlackListedTokenRepository(BlackListedTokenModel);

export const authentication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { authorization: token } = req.headers;
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Please Login First" });
  }

  const decodedData = verifyToken(
    token,
    process.env.JWT_ACCESS_SECRET as string
  );
  if (!decodedData._id) {
    return res.status(401).json({ success: false, message: "Invalid Payload" });
  }

  const blackListedToken = await blackListedRepo.findOneDocument({
    tokenId: decodedData.jti,
  });
  if (blackListedToken) {
    return res
      .status(401)
      .json({
        success: false,
        message: "Your Session Is Expired Please Login Again",
      });
  }

  const user: IUser | null = await userRepo.findDocumentById(
    decodedData._id,
    "-password"
  );
  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "Please Loign First" });
  }

  (req as unknown as IRequest).loggedInUser = { user, token: decodedData as JwtPayload };
  next();
};
