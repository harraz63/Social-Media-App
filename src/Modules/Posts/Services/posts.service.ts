import { CommentModel, PostModel, UserModel } from "../../../DB/Models";
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
import mongoose, { Types } from "mongoose";
import {
  CommentRepository,
  FriendShipRepository,
  UserRepository,
} from "../../../DB/Repositories";
import { FriendShipStatusEnum } from "../../../Common/Enums";
import { pagination } from "../../../Utils/Pagination/pagination.utils";

export class PostService {
  private userRepo = new UserRepository(UserModel);
  private friendShipRepo = new FriendShipRepository();
  private commentRepo = new CommentRepository(CommentModel);
  private postRepo = new PostRepository(PostModel);
  private s3Client = new S3ClientService();

  private deleteCommentsRecursively = async (
    refId: any,
    onModel: "Post" | "Comment"
  ) => {
    // Find all comments for this reference
    const comments = await this.commentRepo.findDocuments({ onModel, refId });

    if (comments.length === 0) return;

    // Delete replies for each comment recursively
    for (const comment of comments) {
      await this.deleteCommentsRecursively(comment._id, "Comment");
    }

    // Delete the comments at this level
    await this.commentRepo.deleteMultipleDocuments({ onModel, refId });
  };

  // createPost = async (req: Request, res: Response) => {
  //   const { text } = req.body;
  //   const media = req.file;
  //   const {
  //     user: { _id: userID },
  //   } = (req as unknown as IRequest).loggedInUser;
  //   if (!text) throw new BadRequestException("Text Is Required");

  //   // If There Are Media Url Upload It On S3
  //   let key;
  //   let url;
  //   if (media) {
  //     const uploadResult = await this.s3Client.uploadFileOnS3(
  //       media,
  //       `${userID}/post`
  //     );

  //     key = uploadResult.key;
  //     url = uploadResult.url;
  //   }

  //   // Create New Post
  //   const post = await this.postRepo.createNewDocument({
  //     authorId: userID,
  //     text: text,
  //     mediaUrl: url,
  //     mediaKey: key,
  //   });

  //   return res.json(
  //     SuccessResponse("Post Created Successfully", 201, { post, mediaUrl: url })
  //   );
  // };

  addPost = async (req: Request, res: Response) => {
    const {
      user: { _id: userId },
    } = (req as unknown as IRequest).loggedInUser;
    const { description, allowComments, tags } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!description && files && !files.length)
      throw new BadRequestException("description Or Files Is Required");

    // Set Tags
    let uniqueTags: Types.ObjectId[] = [];
    if (tags) {
      // Convert tags to array if it's a string
      const tagsArray = Array.isArray(tags) ? tags : [tags];

      const users = await this.userRepo.findDocuments({
        _id: { $in: tagsArray },
      });

      if (users.length !== tagsArray.length)
        throw new BadRequestException("Invalid Tags");

      // Validate Frinds
      // Uer populate Instead Of userRepo
      const friends = await this.friendShipRepo.findDocuments({
        status: FriendShipStatusEnum.ACCEPTED,
        $or: [
          { requestFromId: userId, requestToId: { $in: tagsArray } },
          { requestFromId: { $in: tagsArray }, requestToId: userId },
        ],
      });

      if (friends.length !== tagsArray.length)
        throw new BadRequestException("Invalid Tags");

      uniqueTags = Array.from(new Set(tagsArray));
    }

    let attachments: string[] = [];
    if (files?.length) {
      const uploadedData = await this.s3Client.uploadMultipleFilesOnS3(
        files,
        `${userId}/posts`
      );
      attachments = uploadedData.map(({ key }) => key);
    }

    const post = await this.postRepo.createNewDocument({
      text: description,
      mediaKey: attachments,
      authorId: userId,
      allowComments,
      tags: uniqueTags,
    });

    return res.json(SuccessResponse("Post Added Successfully", 201, { post }));
  };

  getAllPosts = async (req: Request, res: Response) => {
    const {
      user: { _id: userId },
    } = (req as unknown as IRequest).loggedInUser;
    const { page, limit } = req.query;

    const { limit: currentLimit, skip } = pagination({
      limit: Number(limit),
      page: Number(page),
    });

    // const posts = await this.postRepo.findDocuments(
    //   {
    //     authorId: { $ne: userId },
    //   },
    //   {},
    //   { limit: currentLimit, skip }
    // );
    // const totalPages = (await this.postRepo.countDocuments()) / Number(limit);
    // if (posts.length === 0) throw new BadRequestException("No Posts Founded");

    const posts = await this.postRepo.postsPagination(
      {},
      {
        limit: currentLimit,
        page: Number(page),
        populate: [
          {
            path: "authorId",
            select: "firstName lastName",
          },
        ],
      }
    );

    res.json(
      SuccessResponse("Posts Is Fetched Successfully", 200, {
        posts,
        // totalPages,
      })
    );
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
    if (post.authorId.toString() !== currentUser._id.toString()) {
      throw new ForbiddenException(
        "You Are Not Allowed To Access This Resource"
      );
    }

    // Delete all comments and nested replies recursively
    await this.deleteCommentsRecursively(postId, "Post");

    // Delete the post
    await post.deleteOne();

    res.json(SuccessResponse("Post Deleted Successfully", 200));
  };

  // Toggle Freeze Post
  toggleFreezePost = async (req: Request, res: Response) => {
    const {
      user: { _id: userId },
    } = (req as IRequest).loggedInUser;
    const { postId } = req.params;

    const post = await this.postRepo.findPostById(
      postId as unknown as Types.ObjectId
    );
    if (!post) throw new NotFoundException("Post Not Found");

    // Check That The Post Belongs To The Logged In User
    if (userId.toString() !== post.authorId.toString()) {
      throw new ForbiddenException("You Are Not Allowed To Modify This Post");
    }

    post.isFrozen = !post.isFrozen;
    await post.save();

    const message = post.isFrozen
      ? "Post Frozen Successfully"
      : "Post Unfrozen Successfully";

    return res.json(SuccessResponse(message, 200));
  };
}

export default new PostService();
