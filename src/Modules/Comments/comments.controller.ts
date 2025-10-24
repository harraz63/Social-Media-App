import express from "express";
import { authentication } from "../../Middlewares";
import CommentsService from "./Services/comments.service";

const commentsController = express.Router();

// Add Comment
commentsController.post("/:postId", authentication, CommentsService.addComment);

// Add Reply
commentsController.post(
  "/:commentId/reply",
  authentication,
  CommentsService.addReply
);

// Get Comments For Post
commentsController.get(
  "/:postId",
  authentication,
  CommentsService.getCommentsForPost
);

// Get Comment With Replies
commentsController.get(
  "/:commentId",
  authentication,
  CommentsService.getCommentWithReplies
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
