
import { verifyToken } from "../Utils";
import { IRequest, IUser } from "../Common/Interfaces";
import { BlackListedTokenModel, UserModel } from "../DB/Models";
import { BlackListedTokenRepository, UserRepository } from "../DB/Repositories";
import { JwtPayload } from "jsonwebtoken";
import { NextFunction, Response, Request } from "express";

const userRepo = new UserRepository(UserModel);
const blackListedRepo = new BlackListedTokenRepository(BlackListedTokenModel);

// Authentication Middleware
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

  // Verify Token
  const decodedData = verifyToken(
    token,
    process.env.JWT_ACCESS_SECRET as string
  );
  if (!decodedData._id) {
    return res.status(401).json({ success: false, message: "Invalid Payload" });
  }

  // Check Blacklisted Token
  const blackListedToken = await blackListedRepo.findOneDocument({
    tokenId: decodedData.jti,
  });
  if (blackListedToken) {
    return res.status(401).json({
      success: false,
      message: "Your Session Is Expired Please Login Again",
    });
  }

  // Fetch User Data
  const user: IUser | null = await userRepo.findDocumentById(
    decodedData._id,
    "-password"
  );
  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "Please Loign First" });
  }

  // Set Logged In User in Request
  (req as unknown as IRequest).loggedInUser = {
    user,
    token: decodedData as JwtPayload,
  };
  next();
};
