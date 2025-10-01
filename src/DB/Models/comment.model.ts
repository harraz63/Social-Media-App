import mongoose from "mongoose";
import { IComment } from "./../../Common/Interfaces/comment.interface";
import { ReactionEnum } from "../../Common/Enums/post.enum";

const commentSchema = new mongoose.Schema<IComment>(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        type: {
          type: String,
          enum: Object.values(ReactionEnum),
          required: true,
        },
      },
    ],
    repliesCounter: { type: Number, default: 0 },
    reactionCounter: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const CommentModel = mongoose.model<IComment>("Comment", commentSchema);

export { CommentModel };
