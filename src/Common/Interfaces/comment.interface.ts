import { Document, Types } from 'mongoose';
import { ReactionEnum } from "../Enums/post.enum";

export interface IComment extends Document {
  authorId: Types.ObjectId;
  refId: Types.ObjectId;
  onModel: "Post" | "Comment";
  text?: string;
  attachments?: string[];
  reactions: Array<{
    userId: Types.ObjectId;
    type: ReactionEnum;
  }>;
  repliesCounter: number;
  reactionCounter: number;
  isFrozen?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  replies?: IComment[];
}
