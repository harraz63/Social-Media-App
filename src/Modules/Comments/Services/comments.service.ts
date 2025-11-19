import { IRequest, IComment } from "../../../Common/Interfaces";
import { CommentModel } from "../../../DB/Models/comment.model";
import { CommentRepository } from "../../../DB/Repositories/comment.repository";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../../../Utils/Errors/exceptions.utils";
import { SuccessResponse } from "../../../Utils/Response/response-helper.utils";
import { BlockModel, PostModel } from "../../../DB/Models";
import { PostRepository } from "../../../DB/Repositories";
import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";

class CommentsService {
  private commentRepo = new CommentRepository(CommentModel);
  private postRepo: PostRepository = new PostRepository(PostModel);

  // Recursive Function To Delete Comments
  private deleteCommentsRecursively = async (
    refId: mongoose.Types.ObjectId,
    onModel: "Post" | "Comment"
  ) => {
    // Find all comments for this reference
    const comments = await this.commentRepo.findDocuments({ onModel, refId });

    if (!comments || comments.length === 0) return;

    // Delete replies for each comment recursively
    for (const comment of comments) {
      await this.deleteCommentsRecursively(
        comment._id as mongoose.Types.ObjectId,
        "Comment"
      );
    }

    // Delete the comments at this level
    await this.commentRepo.deleteMultipleDocuments({ onModel, refId });
  };

  // Add Comment
  addComment = async (req: Request, res: Response) => {
    const { text } = req.body;
    const {
      user: { _id: userId },
    } = (req as unknown as IRequest).loggedInUser;
    const { postId } = req.params;

    // Validate Input
    if (!text) throw new BadRequestException("Please Enter Comment Text");
    if (!postId) throw new BadRequestException("Please Enter Post Id");

    // Find Post
    const post = await this.postRepo.findPostById(
      postId as unknown as Types.ObjectId
    );
    if (!post) throw new NotFoundException("Post Not Found");

    // Check Block Relationship Between The Two Users
    const isBlocked = await BlockModel.findOne({
      $or: [
        { blockerId: userId, blockedId: post.authorId },
        { blockerId: post.authorId, blockedId: userId },
      ],
    });
    if (isBlocked)
      throw new ForbiddenException("You Cannot Interact With This User");

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

  // Add Reply
  addReply = async (req: Request, res: Response) => {
    const { text } = req.body;
    const {
      user: { _id: userId },
    } = (req as unknown as IRequest).loggedInUser;
    const { commentId } = req.params;

    // Validate Input
    if (!text) throw new BadRequestException("Please Enter Comment Text");
    if (!commentId) throw new BadRequestException("Please Enter Comment Id");

    // Find Comment
    const comment = await this.commentRepo.findCommentById(
      commentId as unknown as mongoose.Types.ObjectId
    );
    if (!comment) throw new NotFoundException("Comment Not Found");

    // Check Block Relationship Between The Two Users
    const isBlocked = await BlockModel.findOne({
      $or: [
        { blockerId: userId, blockedId: comment.authorId },
        { blockerId: comment.authorId, blockedId: userId },
      ],
    });
    if (isBlocked)
      throw new ForbiddenException("You Cannot Interact With This User");

    // Check If This Comment Is Frozen
    if (comment.isFrozen) {
      throw new ForbiddenException("You Cannot Comment On Frozen Comment");
    }

    // Create Reply In DB
    const reply = await this.commentRepo.createNewDocument({
      authorId: userId,
      refId: commentId as unknown as mongoose.Types.ObjectId,
      onModel: "Comment",
      text: text,
    });

    // Increase Replies Counter By 1
    comment.repliesCounter += 1;

    await comment.save();

    res.json(SuccessResponse("Your Reply Is Created Successfully", 201, reply));
  };

  // Get Comments For Post
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

  // Get Comment With Replies
  getCommentWithReplies = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    if (!commentId) {
      throw new BadRequestException("Comment ID is required");
    }

    // Get the main comment
    const comment = await this.commentRepo.findDocumentById(
      commentId as unknown as Types.ObjectId,
      {},
      { populate: "authorId firstName lastName profilePicture" }
    );
    if (!comment) throw new NotFoundException("Comment Not Found");

    // Convert to plain object to avoid modifying the mongoose document
    const commentObj = comment.toObject() as IComment & {
      replies?: IComment[];
    };

    // Get all replies recursively
    const getReplies = async (
      parentId: mongoose.Types.ObjectId
    ): Promise<IComment[]> => {
      const replies = await this.commentRepo.findDocuments({
        refId: parentId,
        onModel: "Comment",
      });

      if (!replies || replies.length === 0) return [];

      // Populate author info for each reply
      await Promise.all(
        replies.map((reply) =>
          reply.populate("authorId", "firstName lastName profilePicture")
        )
      );

      // Get nested replies for each reply
      const repliesWithNested = await Promise.all(
        replies.map(async (reply) => {
          const replyObj = reply.toObject() as IComment & {
            replies?: IComment[];
          };
          replyObj.replies = await getReplies(
            reply._id as unknown as mongoose.Types.ObjectId
          );
          return replyObj;
        })
      );

      return repliesWithNested;
    };

    // Add replies to the main comment
    commentObj.replies = await getReplies(
      comment._id as unknown as mongoose.Types.ObjectId
    );

    res.json(
      SuccessResponse(
        "Comment with replies fetched successfully",
        200,
        commentObj
      )
    );
  };

  // Update Comment
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

  // Toggle Freeze Comment
  toggleFreezeComment = async (req: Request, res: Response) => {
    const {
      user: { _id: userId },
    } = (req as IRequest).loggedInUser;
    const { commentId } = req.params;

    // Find Comment
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

    // Toggle Freeze
    comment.isFrozen = !comment.isFrozen;
    await comment.save();

    const message = comment.isFrozen
      ? "Comment Frozen Successfully"
      : "Comment Unfrozen Successfully";

    return res.json(
      SuccessResponse(message, 200, { isFrozen: comment.isFrozen })
    );
  };

  // Delete Comment
  deleteComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const {
      user: { _id: userId },
    } = (req as unknown as IRequest).loggedInUser;

    // Find Comment
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
    await this.deleteCommentsRecursively(
      comment._id as mongoose.Types.ObjectId,
      "Comment"
    );

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
