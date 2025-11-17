import { RoleEnum } from "../Common/Enums";
import { IRequest } from "../Common/Interfaces";
import { NextFunction, Request, Response } from "express";

// Authorization Middleware
export const authorizationMiddleware = (allowedRoles: RoleEnum[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { role },
    } = (req as IRequest).loggedInUser;

    if (allowedRoles.includes(role)) {
      return next();
    }

    return res.status(401).json({ success: false, message: "Unauthorized" });
  };
};
