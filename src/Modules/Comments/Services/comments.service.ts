import { IRequest } from "../../../Common/Interfaces";
import { CommentModel } from "../../../DB/Models/comment.model";
import { CommentRepository } from "../../../DB/Repositories/comment.repository";
import { Request, Response } from "express";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../../../Utils/Errors/exceptions.utils";
import mongoose, { Types } from "mongoose";
import { SuccessResponse } from "../../../Utils/Response/response-helper.utils";
import { PostModel } from "../../../DB/Models";
import { PostRepository } from "../../../DB/Repositories";

class CommentsService {
  private commentRepo = new CommentRepository(CommentModel);
  private postRepo: PostRepository = new PostRepository(PostModel);

  private deleteCommentsRecursively = async (
    refId: mongoose.Types.ObjectId,
    onModel: "Post" | "Comment"
  ) => {
    // Find all comments for this reference
    const comments = await this.commentRepo.findDocuments({ onModel, refId });

    if (!comments || comments.length === 0) return;

    // Delete replies for each comment recursively
    for (const comment of comments) {
      await this.deleteCommentsRecursively(comment._id, "Comment");
    }

    // Delete the comments at this level
    await this.commentRepo.deleteMultipleDocuments({ onModel, refId });
  };

  addComment = async (req: Request, res: Response) => {
    const { text } = req.body;
    const {
      user: { _id: userId },
    } = (req as unknown as IRequest).loggedInUser;
    const { postId } = req.params;

    if (!text) throw new BadRequestException("Please Enter Comment Text");
    if (!postId) throw new BadRequestException("Please Enter Post Id");

    const post = await this.postRepo.findPostById(
      postId as unknown as Types.ObjectId
    );
    if (!post) throw new NotFoundException("Post Not Found");

    // Check If This Post Is Frozen
    if (post.isFrozen) {
      throw new ForbiddenException("You Cannot Comment On Frozen Post");
    }

    // Create Commnet In DB
    const comment = await this.commentRepo.createNewDocument({
      authorId: userId,
      refId: postId as unknown as mongoose.Types.ObjectId,
      onModel: "Post",
      text: text,
    });

    // Increase Comments Counter By 1
    post.commentsCounter += 1;

    await post.save();

    res.json(
      SuccessResponse("Your Comment Is Created Successfully", 201, comment)
    );
  };

  getCommentsForPost = async (req: Request, res: Response) => {
    const { postId } = req.params;
    if (!postId) throw new BadRequestException("Post ID Is Required");

    const comments = await this.commentRepo.findCommentsByPostId(
      postId as unknown as mongoose.Types.ObjectId
    );

    if (comments.length === 0)
      throw new NotFoundException("No Comments Found For This Post");

    res.json(SuccessResponse("Comments Fetched Successfully", 200, comments));
  };

  updateComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const { text } = req?.body;
    const {
      user: { _id: userID },
    } = (req as unknown as IRequest).loggedInUser;

    if (!text) throw new BadRequestException("Text Is Required");

    // Check If Comment Ownes Is The Current User
    const comment = await this.commentRepo.findCommentById(
      commentId as unknown as mongoose.Types.ObjectId
    );
    if (!comment) throw new NotFoundException("Comment Not Found");
    if (userID.toString() !== comment.authorId.toString()) {
      throw new ForbiddenException(
        "You Are Not Allowed To Perform This Action On This Comment"
      );
    }

    comment.text = text;
    await comment.save();

    res.json(SuccessResponse("Comment Updated Successfully", 200, comment));
  };

  toggleFreezeComment = async (req: Request, res: Response) => {
    const {
      user: { _id: userId },
    } = (req as IRequest).loggedInUser;
    const { commentId } = req.params;

    const comment = await this.commentRepo.findCommentById(
      commentId as unknown as mongoose.Types.ObjectId
    );
    if (!comment) throw new NotFoundException("Comment Not Found");

    // Check That The Comment Belongs To The Logged In User
    if (userId.toString() !== comment.authorId.toString()) {
      throw new ForbiddenException(
        "You Are Not Allowed To Modify This Comment"
      );
    }

    comment.isFrozen = !comment.isFrozen;
    await comment.save();

    const message = comment.isFrozen
      ? "Comment Frozen Successfully"
      : "Comment Unfrozen Successfully";

    return res.json(
      SuccessResponse(message, 200, { isFrozen: comment.isFrozen })
    );
  };

  deleteComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const {
      user: { _id: userId },
    } = (req as unknown as IRequest).loggedInUser;

    const comment = await this.commentRepo.findCommentById(
      commentId as unknown as mongoose.Types.ObjectId
    );
    if (!comment) throw new NotFoundException("Comment Not Found");

    // Check That Comment Belongs To Current User
    if (comment?.authorId.toString() !== userId.toString()) {
      throw new ForbiddenException(
        "You Are Not Allowed To Perform This Action On This Comment"
      );
    }

    // Delete all replies recursively
    await this.deleteCommentsRecursively(comment._id, "Comment");

    // Delete the comment
    await comment.deleteOne();

    // Update parent's comment counter if this is a reply
    if (comment.onModel === "Comment") {
      await CommentModel.findByIdAndUpdate(comment.refId, {
        $inc: { repliesCounter: -1 },
      });
    } else {
      // Update post's comment counter if this is a top-level comment
      await PostModel.findByIdAndUpdate(comment.refId, {
        $inc: { commentsCounter: -1 },
      });
    }

    res.json(SuccessResponse("Comment Deleted Successfully", 200));
  };
}

export default new CommentsService();
