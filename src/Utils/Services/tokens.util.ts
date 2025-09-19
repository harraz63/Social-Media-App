import jwt, { SignOptions } from "jsonwebtoken";
import { ITokenPayload } from "../../Common/Interfaces";

// Generate
export const generateToken = (
  payload: ITokenPayload | Buffer | object,
  secret: string,
  options: SignOptions
) => {
  return jwt.sign(payload, secret, options);
};

// Verify
export const verifyToken = (token: string, secret: string): ITokenPayload => {
  return jwt.verify(token, secret) as ITokenPayload;
};
