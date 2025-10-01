import express from "express";
import { authentication } from "../../Middlewares";
import reactsService from "./Services/reacts.service";

const reactsController = express.Router();

// Add React To Post
reactsController.post(
  "/posts/:postId",
  authentication,
  reactsService.addReactToPost
);

// Add React To Comment
reactsController.post(
  "/comments/:commentId",
  authentication,
  reactsService.addReactToComment
);

// Delete React From Post
reactsController.delete(
  "/posts/:postId",
  authentication,
  reactsService.deleteReactFromPost
);

// Delete React From Comment
reactsController.delete(
  "/comments/:commentId",
  authentication,
  reactsService.deleteReactFromComment
);

// Get All Reacts On Specific Post
reactsController.get("/posts/:postId", reactsService.getReactsOnPost);

// Get All Reacts On Specific Comment
reactsController.get("/comments/:commentId", reactsService.getReactsOnComment)

export { reactsController };
