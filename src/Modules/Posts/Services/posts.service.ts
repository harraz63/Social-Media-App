import { PostModel } from "../../../DB/Models";
import { PostRepository } from "../../../DB/Repositories/post.repository";
import { S3ClientService } from "../../../Utils";

import { Request, Response } from "express";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../../../Utils/Errors/exceptions.utils";
import { IPost, IRequest } from "../../../Common/Interfaces";
import { SuccessResponse } from "../../../Utils/Response/response-helper.utils";
import mongoose from "mongoose";

export class PostService {
  private postRepo = new PostRepository(PostModel);
  private s3Client = new S3ClientService();

  createPost = async (req: Request, res: Response) => {
    const { text } = req.body;
    const media = req.file;
    const {
      user: { _id: userID },
    } = (req as unknown as IRequest).loggedInUser;
    if (!text) throw new BadRequestException("Text Is Required");

    // If There Are Media Url Upload It On S3
    let key;
    let url;
    if (media) {
      const uploadResult = await this.s3Client.uploadFileOnS3(
        media,
        `${userID}/post`
      );

      key = uploadResult.key;
      url = uploadResult.url;
    }

    // Create New Post
    const post = await this.postRepo.createNewDocument({
      authorId: userID,
      text: text,
      mediaUrl: url,
      mediaKey: key,
    });

    return res.json(
      SuccessResponse("Post Created Successfully", 201, { post, mediaUrl: url })
    );
  };

  getAllPosts = async (req: Request, res: Response) => {
    const posts = await this.postRepo.findDocuments({}, { __v: 0 });
    if (posts.length === 0) throw new BadRequestException("No Posts Founded");

    res.json(SuccessResponse("Posts Is Fetched Successfully", 200, posts));
  };

  getPostByUserID = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const userPosts = await this.postRepo.findPostsByAuthorId(
      userId as unknown as mongoose.Types.ObjectId
    );
    if (userPosts.length === 0)
      throw new BadRequestException("This User Has No Posts");

    res.json(
      SuccessResponse("User Posts Is Fetched Successfully", 200, userPosts)
    );
  };

  updateOwnPost = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { user: currentUser } = (req as unknown as IRequest).loggedInUser;
    const { text, reactions }: Partial<IPost> = req.body;

    // Find The Post
    const post = await this.postRepo.findPostById(
      postId as unknown as mongoose.Types.ObjectId
    );
    if (!post) {
      throw new NotFoundException("Post Not Found");
    }
    // Check If The Post Belongs To Current User
    if (post?.authorId.toString() !== currentUser._id.toString()) {
      throw new ForbiddenException(
        "You Are Not Allowed To Access This Resource"
      );
    }
    if (text) post.text = text;
    if (reactions) post.reactions = reactions;

    await post.save();

    res.json(SuccessResponse("Post Updated Successfully", 200, post));
  };

  deleteOwnPost = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { user: currentUser } = (req as unknown as IRequest).loggedInUser;

    // Find The Post
    const post = await this.postRepo.findPostById(
      postId as unknown as mongoose.Types.ObjectId
    );
    if (!post) {
      throw new NotFoundException("Post Not Found");
    }
    // Check If The Post Belongs To Current User
    if (post?.authorId.toString() !== currentUser._id.toString()) {
      throw new ForbiddenException(
        "You Are Not Allowed To Access This Resource"
      );
    }

    await post.deleteOne();

    res.json(SuccessResponse("Post Deleted Successfully", 200));
  };
}

export default new PostService();
