import mongoose from "mongoose";
import { ReactionEnum } from "../Enums/post.enum";
export interface IComment {
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  text: string;
  parentCommentId?: mongoose.Types.ObjectId | null;
  reactions: {
    userId: mongoose.Types.ObjectId;
    type: ReactionEnum;
  }[];
  repliesCounter: number;
  reactionCounter: number;
  createdAt?: Date;
  updatedAt?: Date;
}
