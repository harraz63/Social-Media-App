import mongoose, { HydratedDocument, Model } from "mongoose";
import { IComment } from "../../Common/Interfaces";
import { BaseRepository } from "./base.repository";

export class CommentRepository extends BaseRepository<IComment> {
  constructor(protected _commentModel: Model<IComment>) {
    super(_commentModel);
  }

  // Find Comments By Post ID
  async findCommentsByPostId(
    postId: mongoose.Types.ObjectId
  ): Promise<HydratedDocument<IComment>[]> {
    return await this.findDocuments({ postId });
  }

  // Find Comment By Id
  async findCommentById(
    commentId: mongoose.Types.ObjectId
  ): Promise<HydratedDocument<IComment> | null> {
    return await this.findDocumentById(commentId);
  }
}
