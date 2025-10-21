import mongoose from "mongoose";
import { IComment } from "./../../Common/Interfaces/comment.interface";
import { ReactionEnum } from "../../Common/Enums/post.enum";

const commentSchema = new mongoose.Schema<IComment>(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "onModel",
      required: true,
    },
    onModel: {
      type: String,
      enum: ["Post", "Comment"],
      required: true,
    },
    text: {
      type: String,
    },
    attachments: [String],
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
