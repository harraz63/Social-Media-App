import { IRequest } from "../../../Common/Interfaces";
import { CommentModel } from "../../../DB/Models/comment.model";
import { CommentRepository } from "../../../DB/Repositories/comment.repository";
import { Request, Response } from "express";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../../../Utils/Errors/exceptions.utils";
import mongoose from "mongoose";
import { SuccessResponse } from "../../../Utils/Response/response-helper.utils";
import { PostModel } from "../../../DB/Models";

class CommentsService {
  private commentRepo = new CommentRepository(CommentModel);

  addComment = async (req: Request, res: Response) => {
    const { text, parentCommentId } = req.body;
    const {
      user: { _id: userId },
    } = (req as unknown as IRequest).loggedInUser;
    const { postId } = req.params;
    // Start Session

    if (!text) throw new BadRequestException("Please Enter Comment Text");
    if (!postId) throw new BadRequestException("Please Enter Post Id");

    // Create Commnet In DB
    const comment = await this.commentRepo.createNewDocument({
      authorId: userId,
      postId: postId as unknown as mongoose.Types.ObjectId,
      text: text,
      parentCommentId: parentCommentId
        ? (parentCommentId as unknown as mongoose.Types.ObjectId)
        : null,
    });

    // Increase Comments Counter By 1
    await PostModel.findByIdAndUpdate(postId, { $inc: { commentsCounter: 1 } });

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

    // Delete The Comment From DB
    await comment.deleteOne();

    // Decrease Commnets Counter By One
    await PostModel.findByIdAndUpdate(comment.postId, {
      $inc: { commentsCounter: -1 },
    });

    res.json(SuccessResponse("Comment Deleted Successfully", 200));
  };
}

export default new CommentsService();
