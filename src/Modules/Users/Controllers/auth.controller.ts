import express from "express";
import AuthService from "../Services/auth.service";

const authController = express();

// Signup
authController.post("/signup", AuthService.signup);
authController.post("/signin", AuthService.signin);
authController.post("/confirm-email", AuthService.confirmEmail);

export { authController };
