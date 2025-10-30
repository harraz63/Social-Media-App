import express from "express";
import { authentication, Multer } from "../../../Middlewares";
import profileService from "../Services/profile.service";

const profileController = express.Router();

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
profileController.put(
  "/update-profile",
  authentication,
  profileService.updateProfileData
);

// Update Cover Picture
profileController.put(
  "/update-cover-picture",
  authentication,
  Multer().single("coverPicture"),
  profileService.uploadCoverPicture
);

// Delete Profile
profileController.delete(
  "/delete-account",
  authentication,
  profileService.deleteAccount
);

// Get Profile Date
profileController.get("/me", authentication, profileService.getMyData);

// Renew Signed URL
profileController.post(
  "/renew-signed-url",
  authentication,
  profileService.renewSignedUrl
);

// Send Friend Request
profileController.post(
  "/send-friend-request",
  authentication,
  profileService.sendFriendShipRequest
);

// List Friend Requests
profileController.get(
  "/list-friend-request",
  authentication,
  profileService.listRequests
);

// Unfrind Friend
profileController.delete(
  "/delete-friend",
  authentication,
  profileService.deleteFriend
);

// Delete Friend Request
profileController.delete(
  "/delete-friend-request",
  authentication,
  profileService.deleteFriendRequest
);


// Response Friend Request
profileController.patch(
  "/respond-to-friend-request",
  authentication,
  profileService.respondToFriendShipRequest
);

// Get All Friends
profileController.get(
  "/list-friends",
  authentication,
  profileService.getAllFriends
);

// Change Email
profileController.put(
  "/change-email",
  authentication,
  profileService.changeEmail
);

// Enable 2FA
profileController.post("/enable-2fa", authentication, profileService.enable2FA);

// Disable 2FA
profileController.post(
  "/disable-2fa",
  authentication,
  profileService.disable2FA
);

// Verify 2FA
profileController.post("/verify-2fa", authentication, profileService.verify2FA);

// Create Group
profileController.post(
  "/create-group",
  authentication,
  profileService.createGroup
);

// Block User
profileController.post(
  "/:blockedUserId/block",
  authentication,
  profileService.blockUser
);

// Unblock User
profileController.post(
  "/:blockedUserId/unblock",
  authentication,
  profileService.unblockUser
);

export { profileController };
