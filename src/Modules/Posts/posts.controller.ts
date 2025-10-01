import express from "express";
import { authentication, Multer } from "../../Middlewares";
import PostService from "./Services/posts.service";
import postsService from "./Services/posts.service";

const postsController = express.Router();

// Create Post
postsController.post(
  "",
  authentication,
  Multer().single("postMedia"),
  PostService.createPost
);

// Get All Posts
postsController.get("", PostService.getAllPosts);

// Get Post By User ID
postsController.get("/:userId", authentication, PostService.getPostByUserID);

// Update Own Post
postsController.put("/:postId", authentication, PostService.updateOwnPost);

// Delete Own Post
postsController.delete("/:postId", authentication, PostService.deleteOwnPost);

export { postsController };
