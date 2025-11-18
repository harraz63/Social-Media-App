import { ITokenPayload } from "../../Common/Interfaces";
import jwt, { SignOptions } from "jsonwebtoken";

// Generate Token
export const generateToken = (
  payload: ITokenPayload | Buffer | object,
  secret: string,
  options: SignOptions
) => {
  return jwt.sign(payload, secret, options);
};

// Verify Token
export const verifyToken = (token: string, secret: string): ITokenPayload => {
  return jwt.verify(token, secret) as ITokenPayload;
};
