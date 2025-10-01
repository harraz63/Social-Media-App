// post.model.ts
import mongoose from "mongoose";
import { IPost } from "../../Common/Interfaces/post.interface";
import { ReactionEnum } from "../../Common/Enums/post.enum";

const postSchema = new mongoose.Schema<IPost>(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, required: true },
    text: { type: String, required: true },
    mediaUrl: { type: String },
    mediaKey: { type: String },
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
    commentsCounter: { type: Number, default: 0 },
    reactionCounter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const PostModel = mongoose.model<IPost>("Post", postSchema);
export { PostModel };
