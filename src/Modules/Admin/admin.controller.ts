import { Router } from "express";
import { authentication, authorizationMiddleware } from "../../Middlewares";
import adminService from "./Services/admin.service";
import { RoleEnum } from "../../Common/Enums";

const adminController = Router();

// Get All Users
adminController.get(
  "/all-users",
  authentication,
  authorizationMiddleware([RoleEnum.ADMIN]),
  adminService.getAllUsers
);

// Delete User
adminController.delete(
  "/delete-user/:id",
  authentication,
  authorizationMiddleware([RoleEnum.ADMIN]),
  adminService.deleteUser
);

// Get All Posts For Moderation
adminController.get(
  "/all-posts",
  authentication,
  authorizationMiddleware([RoleEnum.ADMIN]),
  adminService.getAllPosts
);

// Remove Inappropriate Post
adminController.delete(
  "/remove-post/:id",
  authentication,
  authorizationMiddleware([RoleEnum.ADMIN]),
  adminService.removePost
);

export { adminController };
