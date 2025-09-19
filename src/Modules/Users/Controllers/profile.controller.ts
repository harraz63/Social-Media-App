import express from "express";
import { authentication, Multer } from "../../../Middlewares";
import profileService from "../Services/profile.service";
// import * as Services from "./Services/user.service";

const profileController = express();

// Upload Profile Picture
profileController.post(
  "/porfile-picture",
  authentication,
  Multer().single("profilePicture"),
  profileService.uploadProfilePicture
);

// Upload Cover Pictures
profileController.post(
  "/cover-picture",
  authentication,
  Multer().single("coverPicture"),
  profileService.uploadCoverPicture
);

// Update Profile

// Delete Profile
profileController.delete(
  "/delete-account",
  authentication,
  profileService.deleteAccount
);

// Get Profile Date

// List All Users

// Renew Signed URL
profileController.post(
  "/renew-signed-url",
  authentication,
  profileService.renewSignedUrl
);

export { profileController };
