// post.model.ts
import { IPost } from "../../Common/Interfaces/post.interface";
import { ReactionEnum } from "../../Common/Enums/post.enum";
import mongoosePaginate from "mongoose-paginate-v2";
import mongoose, { PaginateModel } from "mongoose";


const postSchema = new mongoose.Schema<IPost>(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    text: { type: String },
    mediaUrl: { type: String },
    mediaKey: [{ type: String }],
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
    allowComments: {
      type: Boolean,
      default: true,
    },
    commentsCounter: { type: Number, default: 0 },
    reactionCounter: { type: Number, default: 0 },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isFrozen: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

postSchema.plugin(mongoosePaginate);

const PostModel = mongoose.model<IPost, PaginateModel<IPost>>(
  "Post",
  postSchema
);
export { PostModel };
