import express from "express";
import { authentication } from "../../Middlewares";
import CommentsService from "./Services/comments.service";

const commentsController = express.Router();

// Add Comment
commentsController.post("/:postId", authentication, CommentsService.addComment);

// Get Comments For Post
commentsController.get(
  "/:postId",
  authentication,
  CommentsService.getCommentsForPost
);

// Update Comment
commentsController.put(
  "/:commentId",
  authentication,
  CommentsService.updateComment
);

// Toggle Freeze Comment
commentsController.put(
  "/:commentId/freeze",
  authentication,
  CommentsService.toggleFreezeComment
);

// Delete Comment
commentsController.delete(
  "/:commentId",
  authentication,
  CommentsService.deleteComment
);

export { commentsController };
