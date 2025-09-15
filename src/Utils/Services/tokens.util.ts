import jwt, { SignOptions } from "jsonwebtoken";
import { ITokenPayload } from "../../Common/Interfaces";

// Generate
export const generateToken = (
  payload: ITokenPayload,
  secret: string,
  options: SignOptions
) => {
  return jwt.sign(payload, secret, options);
};

// Verify
export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret);
};
