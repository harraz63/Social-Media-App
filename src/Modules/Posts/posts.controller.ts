import express from "express";
import { authentication, Multer } from "../../Middlewares";
import PostService from "./Services/posts.service";

const postsController = express.Router();

// Create Post
postsController.post(
  "",
  authentication,
  Multer().array("postMedia", 4),
  PostService.addPost
);

// Get All Posts
postsController.get("/home", authentication, PostService.getAllPosts);

// Get Post By User ID
postsController.get("/:userId", authentication, PostService.getPostByUserID);

// Update Own Post
postsController.put("/:postId", authentication, PostService.updateOwnPost);

// Toggle Freeze Own Post
postsController.put(
  "/:postId/freeze",
  authentication,
  PostService.toggleFreezePost
);

// Delete Own Post
postsController.delete("/:postId", authentication, PostService.deleteOwnPost);

export { postsController };
