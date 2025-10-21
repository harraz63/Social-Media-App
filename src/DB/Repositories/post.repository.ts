import mongoose, {
  FilterQuery,
  HydratedDocument,
  Model,
  PaginateOptions,
} from "mongoose";
import { IPost } from "../../Common/Interfaces";
import { BaseRepository } from "./base.repository";
import { PostModel } from "../Models";

export class PostRepository extends BaseRepository<IPost> {
  constructor(protected _postModel: Model<IPost>) {
    super(_postModel);
  }

  // Find Posts By Author ID
  async findPostsByAuthorId(
    authorId: mongoose.Types.ObjectId
  ): Promise<HydratedDocument<IPost>[]> {
    return await this.findDocuments({ authorId });
  }

  // Find Post By Post ID
  async findPostById(
    postId: mongoose.Types.ObjectId
  ): Promise<HydratedDocument<IPost> | null> {
    return await this.findDocumentById(postId);
  }

  async countDocuments() {
    return await PostModel.countDocuments();
  }

  async postsPagination(
    filters?: FilterQuery<IPost>,
    options?: PaginateOptions
  ) {
    return await PostModel.paginate(filters, options);
  }
}
