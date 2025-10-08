import express from "express";
import AuthService from "../Services/auth.service";
import {
  authentication,
  validationMiddleware,
  verifyRefreshToken,
} from "../../../Middlewares";
// import { signupSchema } from "../../../Validators";

const authController = express.Router();

// Signup
authController.post("/signup", AuthService.signup);

// Confirm Email
authController.post("/confirm-email", AuthService.confirmEmail);

// Signin
authController.post("/signin", AuthService.signin);

// Logout
authController.post(
  "/logout",
  authentication,
  verifyRefreshToken,
  AuthService.logout
);

// Refresh Token
authController.post(
  "/refresh-token",
  verifyRefreshToken,
  AuthService.refreshToken
);

export { authController };
