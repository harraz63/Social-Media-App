import { FilterQuery, Model, ProjectionType, QueryOptions } from "mongoose";

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

  findDocumentById() {}

  updateOneDocument() {}

  deleteOneDocument() {}

  deleteMultipleDocuments() {}

  findAndUpdateDocument() {}

  findAndDeleteDocument() {}

  findDocuments() {}
}
