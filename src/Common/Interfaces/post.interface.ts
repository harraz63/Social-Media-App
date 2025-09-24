import mongoose from "mongoose";

export interface IPost {
  authorId: mongoose.Types.ObjectId;
  text: string;
  commentsCounter: number;
  mediaUrl?: string;
  mediaKey?: string;
  reactions?: {
    like: number;
    love: number;
    haha: number;
    wow: number;
    sad: number;
    angry: number;
  };
}
