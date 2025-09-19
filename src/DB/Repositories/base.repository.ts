import mongoose, {
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
} from "mongoose";

export abstract class BaseRepository<T> {
  constructor(private model: Model<T>) {}

  async createNewDocument(document: Partial<T>): Promise<T> {
    return await this.model.create(document);
  }

  async findOneDocument(
    filters: FilterQuery<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>
  ): Promise<T | null> {
    return await this.model.findOne(filters, projection, options);
  }

  async findDocumentById(
    id: mongoose.Types.ObjectId | string,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>
  ): Promise<T | null> {
    return await this.model.findById(id, projection, options);
  }

  async deleteByIdDocument(id: mongoose.Types.ObjectId) {
    return await this.model.findByIdAndDelete(id);
  }

  updateOneDocument() {}

  deleteOneDocument() {}

  deleteMultipleDocuments() {}

  findAndUpdateDocument() {}

  findAndDeleteDocument() {}

  findDocuments() {}
}
