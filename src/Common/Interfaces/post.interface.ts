// post.interface.ts
import mongoose from "mongoose";

export interface IPost {
  authorId: mongoose.Types.ObjectId;
  text: string;
  commentsCounter: number;
  allowComments: boolean;
  reactionCounter: number;
  mediaUrl?: string;
  mediaKey?: string[];
  reactions: {
    userId: mongoose.Types.ObjectId;
    type: "like" | "love" | "haha" | "wow" | "sad" | "angry";
  }[];
  tags?: mongoose.Types.ObjectId[];
}
