import mongoose from "mongoose";
import {
  FilterQuery,
  HydratedDocument,
  Model,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
  DeleteResult,
  UpdateResult,
  MongooseBaseQueryOptions,
  MongooseUpdateQueryOptions,
  AnyObject,
} from "mongoose";

export abstract class BaseRepository<T> {
  constructor(private model: Model<T>) {}

  async createNewDocument(document: Partial<T>): Promise<HydratedDocument<T>> {
    return await this.model.create(document);
  }

  async findOneDocument(
    filters: FilterQuery<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>
  ): Promise<HydratedDocument<T> | null> {
    return await this.model.findOne(filters, projection, options);
  }

  async findDocumentById(
    id: mongoose.Types.ObjectId | string,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>
  ): Promise<HydratedDocument<T> | null> {
    return await this.model.findById(id, projection, options);
  }

  async deleteByIdDocument(
    id: mongoose.Types.ObjectId | string
  ): Promise<HydratedDocument<T> | null> {
    return await this.model.findByIdAndDelete(id);
  }

  async deleteOneDocument(
    filters: FilterQuery<T>,
    options?: (MongooseBaseQueryOptions<T> & AnyObject) | null
  ): Promise<DeleteResult> {
    return await this.model.deleteOne(filters, options);
  }

  async deleteMultipleDocuments(
    filters: FilterQuery<T>,
    options?: (MongooseBaseQueryOptions<T> & AnyObject) | null
  ): Promise<DeleteResult> {
    return await this.model.deleteMany(filters, options);
  }

  async updateOneDocument(
    filters: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions<T>
  ): Promise<HydratedDocument<T> | null> {
    return await this.model.findOneAndUpdate(filters, update, options);
  }

  async updateManyDocuments(
    filters: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: MongooseUpdateQueryOptions<T>
  ): Promise<UpdateResult> {
    return await this.model.updateMany(filters, update, options);
  }

  // ✅ findByIdAndUpdateDocument
  async findByIdAndUpdateDocument(
    id: mongoose.Types.ObjectId | string,
    update: UpdateQuery<T>,
    options?: QueryOptions<T>
  ): Promise<HydratedDocument<T> | null> {
    return await this.model.findByIdAndUpdate(id, update, options);
  }

  // ✅ findAndDeleteDocument
  async findAndDeleteDocument(
    filters: FilterQuery<T>,
    options?: QueryOptions<T>
  ): Promise<HydratedDocument<T> | null> {
    return await this.model.findOneAndDelete(filters, options);
  }

  // ✅ findByIdAndDeleteDocument
  async findByIdAndDeleteDocument(
    id: mongoose.Types.ObjectId | string,
    options?: QueryOptions<T>
  ): Promise<HydratedDocument<T> | null> {
    return await this.model.findByIdAndDelete(id, options);
  }

  // ✅ findDocuments (multiple find)
  async findDocuments(
    filters: FilterQuery<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>
  ): Promise<HydratedDocument<T>[]> {
    return await this.model.find(filters, projection, options);
  }
}
