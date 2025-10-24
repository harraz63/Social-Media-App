import { ReactionEnum } from "../../../Common/Enums/post.enum";
import { IRequest } from "../../../Common/Interfaces";
import { CommentModel, PostModel } from "../../../DB/Models";
import { CommentRepository, PostRepository } from "../../../DB/Repositories";
import { Request, Response } from "express";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../../../Utils/Errors/exceptions.utils";
import mongoose from "mongoose";
import { SuccessResponse } from "../../../Utils/Response/response-helper.utils";

class ReactsService {
  private postRepo: PostRepository = new PostRepository(PostModel);
  private commentsRepo: CommentRepository = new CommentRepository(CommentModel);

  addReactToPost = async (req: Request, res: Response) => {
    const { reactionType } = req.body as { reactionType: ReactionEnum };
    const { postId } = req.params;
    const {
      user: { _id: userId },
    } = (req as unknown as IRequest).loggedInUser;

    if (!reactionType || !Object.values(ReactionEnum).includes(reactionType)) {
      throw new BadRequestException("Invalid Reaction Type");
    }

    // Find The Post
    const post = await this.postRepo.findPostById(
      postId as unknown as mongoose.Types.ObjectId
    );
    if (!post) throw new NotFoundException("Post Not Found");

    // Check If The Post Is Frozen
    if (post.isFrozen) {
      throw new ForbiddenException("You Cannot React On Frozen Post")
    }

    // Check If User Already Reacted
    const existingReaction = post.reactions?.find(
      (react) => react.userId.toString() === userId.toString()
    );

    if (existingReaction) {
      if (existingReaction.type === reactionType) {
        // Same reaction → do nothing
        return res.json(
          SuccessResponse("Reaction Already Exists", 200, {
            postId,
            reactionCounter: post.reactionCounter,
            reactions: post.reactions,
          })
        );
      }

      // Different reaction → update only
      existingReaction.type = reactionType;
      await post.save();

      return res.json(
        SuccessResponse("Reaction Updated Successfully", 200, {
          postId,
          reactionCounter: post.reactionCounter,
          reactions: post.reactions,
        })
      );
    }

    // First time reacting → add new
    post.reactions.push({ userId, type: reactionType });
    post.reactionCounter += 1;
    await post.save();

    return res.json(
      SuccessResponse("Reaction Added Successfully", 200, {
        postId,
        reactionCounter: post.reactionCounter,
        reactions: post.reactions,
      })
    );
  };

  addReactToComment = async (req: Request, res: Response) => {
    const {
      user: { _id: userId },
    } = (req as unknown as IRequest).loggedInUser;
    const { reactionType } = req.body as { reactionType: ReactionEnum };
    const { commentId } = req.params;

    // Checks About Comment ID And Reaction Type
    if (!commentId) throw new BadRequestException("Comment ID Is Required");
    if (!reactionType || !Object.values(ReactionEnum).includes(reactionType))
      throw new BadRequestException("Invalid Reaction Type");

    const comment = await this.commentsRepo.findCommentById(
      commentId as unknown as mongoose.Types.ObjectId
    );
    if (!comment) throw new NotFoundException("Comment Not Found");

    // Check If User Already Reacted On This Post
    const existingReaction = comment.reactions?.find(
      (r) => r.userId.toString() === userId.toString()
    );
    if (existingReaction) {
      // If Same Reaction
      if (existingReaction.type === reactionType) {
        // Same Reaction -> Do Nothing
        return res.json(
          SuccessResponse("Reaction Already Exists", 200, {
            commentId,
            reactionCounter: comment.reactionCounter,
            reactions: comment.reactions,
          })
        );
      }

      // Different Reaction -> Update It
      existingReaction.type = reactionType;
      await comment.save();
      return res.json(
        SuccessResponse("Reaction Updated Successfully", 200, {
          commentId,
          reactionCounter: comment.reactionCounter,
          reactions: comment.reactions,
        })
      );
    }

    // First Time Reacting -> Add One
    comment.reactions?.push({ type: reactionType, userId });
    comment.reactionCounter += 1;
    await comment.save();

    return res.json(
      SuccessResponse("Reaction Added Successfully", 200, {
        commentId,
        reactionCounter: comment.reactionCounter,
        reactions: comment.reactions,
      })
    );
  };

  deleteReactFromPost = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const {
      user: { _id: userId },
    } = (req as unknown as IRequest).loggedInUser;

    const post = await this.postRepo.findPostById(
      postId as unknown as mongoose.Types.ObjectId
    );
    if (!post) throw new NotFoundException("Post Not Found");

    // Find USer Reaction
    const userReact = post.reactions.find(
      (react) => react.userId.toString() === userId.toString()
    );
    if (!userReact) throw new NotFoundException("React Not Found");

    // Delete This Reaction
    post.reactions = post.reactions.filter(
      (react) => react.userId.toString() !== userId.toString()
    );
    // Update Reaction Counter
    post.reactionCounter = post.reactions.length;
    await post.save();

    return res.json(
      SuccessResponse("Reaction Deleted Successfully", 200, {
        postId: post._id,
        reactionCounter: post.reactionCounter,
        reactions: post.reactions,
      })
    );
  };

  deleteReactFromComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const {
      user: { _id: userId },
    } = (req as unknown as IRequest).loggedInUser;

    const comment = await this.commentsRepo.findCommentById(
      commentId as unknown as mongoose.Types.ObjectId
    );
    if (!comment) throw new NotFoundException("Comment Not Found");

    // Find The Reaction
    const userReact = comment.reactions?.find(
      (react) => react.userId.toString() === userId.toString()
    );
    if (!userReact) throw new NotFoundException("React Not Found");

    // Delete The Reaction
    comment.reactions = comment.reactions?.filter(
      (react) => react.userId.toString() !== userId.toString()
    );
    // Update Reaction Counter
    comment.reactionCounter = comment.reactions.length;
    await comment.save();

    return res.json(
      SuccessResponse("Reaction Deleted Successfully", 200, {
        postId: comment._id,
        reactionCounter: comment.reactionCounter,
        reactions: comment.reactions,
      })
    );
  };

  getReactsOnPost = async (req: Request, res: Response) => {
    const { postId } = req.params;

    const post = await this.postRepo.findPostById(
      postId as unknown as mongoose.Types.ObjectId
    );
    if (!post?.reactions || post.reactionCounter === 0) {
      return res.json(
        SuccessResponse("No Reactions Found", 200, {
          reactions: [],
          reactionCounter: 0,
          summary: {},
        })
      );
    }

    // Build A Summary Grouped By Reaction Type
    const summary = post.reactions.reduce<Record<string, number>>((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {});

    return res.json(
      SuccessResponse("Reacts Fetched Successfully", 200, {
        reactions: post.reactions,
        reactionCounter: post.reactionCounter,
        summary,
      })
    );
  };

  getReactsOnComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;

    const comment = await this.commentsRepo.findCommentById(
      commentId as unknown as mongoose.Types.ObjectId
    );
    if (!comment?.reactions || comment.reactionCounter === 0) {
      return res.json(
        SuccessResponse("No Reactions Found", 200, {
          reactions: [],
          reactionCounter: 0,
          summary: {},
        })
      );
    }

    // Build A Summary Grouped By Reaction Type
    const summary = comment.reactions.reduce<Record<string, number>>(
      (acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      },
      {}
    );

    return res.json(
      SuccessResponse("Reacts Fetched Successfully", 200, {
        reactions: comment.reactions,
        reactionCounter: comment.reactionCounter,
        summary,
      })
    );
  };
}

export default new ReactsService();
