import { NextFunction, Request, Response } from "express";
import { BadRequestException } from "../Utils/Errors/exceptions.utils";
import { verifyToken } from "../Utils";
import { IRequest } from "../Common/Interfaces";

export const verifyRefreshToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new BadRequestException("Refresh Token Is Required");

  const decotedData = verifyToken(
    refreshToken,
    process.env.JWT_REFRESH_SECRET as string
  );

  (req as any).refreshToken = decotedData;

  next();
};
