import express from "express";
import AuthService from "../Services/auth.service";
import {
  authentication,
  verifyRefreshToken,
  validationMiddleware,
} from "../../../Middlewares";
import {
  signupSchema,
  signinSchema,
  confirmEmailSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
} from "../../../Validators";

const authController = express.Router();

// Signup
authController.post(
  "/signup",
  validationMiddleware(signupSchema),
  AuthService.signup
);

// Confirm Email
authController.post(
  "/confirm-email",
  validationMiddleware(confirmEmailSchema),
  AuthService.confirmEmail
);

// Signin
authController.post(
  "/signin",
  validationMiddleware(signinSchema),
  AuthService.signin
);

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

// Forget Password
authController.post(
  "/forget-password",
  validationMiddleware(forgetPasswordSchema),
  AuthService.forgetPassword
);

// Reset Password
authController.post(
  "/reset-password",
  validationMiddleware(resetPasswordSchema),
  AuthService.resetPassword
);

export { authController };
