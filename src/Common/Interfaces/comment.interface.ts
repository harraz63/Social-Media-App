import mongoose from "mongoose";
import { ReactionEnum } from "../Enums/post.enum";
export interface IComment {
  authorId: mongoose.Types.ObjectId;
  refId: mongoose.Types.ObjectId;
  onModel: "Post" | "Comment";
  text?: string;
  attachments?: string[];
  reactions: {
    userId: mongoose.Types.ObjectId;
    type: ReactionEnum;
  }[];
  repliesCounter: number;
  reactionCounter: number;
  isFrozen?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
