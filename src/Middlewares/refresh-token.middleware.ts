import { BadRequestException } from "../Utils/Errors/exceptions.utils";
import { verifyToken } from "../Utils";
import { NextFunction, Request, Response } from "express";

// Verify Refresh Token
export const verifyRefreshToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new BadRequestException("Refresh Token Is Required");

  // Verify Refresh Token
  const decotedData = verifyToken(
    refreshToken,
    process.env.JWT_REFRESH_SECRET as string
  );

  // Set Refresh Token in Request
  (req as any).refreshToken = decotedData;

  next();
};
