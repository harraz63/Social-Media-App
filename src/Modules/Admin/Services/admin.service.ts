import { PostRepository, UserRepository } from "../../../DB/Repositories";
import { PostModel, UserModel } from "../../../DB/Models";
import {
  BadRequestException,
  NotFoundException,
} from "../../../Utils/Errors/exceptions.utils";
import { SuccessResponse } from "../../../Utils/Response/response-helper.utils";
import { RoleEnum } from "../../../Common/Enums";
import { Request, Response } from "express";


class AdminService {
  private userRepo = new UserRepository(UserModel);
  private postRepo = new PostRepository(PostModel);

  // Get All Users
  getAllUsers = async (req: Request, res: Response) => {
    const users = await this.userRepo.findDocuments({});
    if (!users || users.length === 0)
      throw new NotFoundException("No Users Found");

    // make safe users object for remove sensitive data
    const safeUsers = users.map((user) => {
      return {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        _id: user._id,
      };
    });

    return res.json(
      SuccessResponse("Users Fetched Successfully", 200, safeUsers)
    );
  };

  // Delete User
  deleteUser = async (req: Request, res: Response) => {
    const { id: userId } = req.params;

    const user = await this.userRepo.findDocumentById(userId);
    if (!user) throw new NotFoundException("User Not Found");

    // Check If Admin Deleted Another Admin
    if (user.role === RoleEnum.ADMIN)
      throw new BadRequestException("Admin Can't Delete Another Admin");

    // Delete The User
    await this.userRepo.deleteByIdDocument(userId);

    return res.json(SuccessResponse("User Deleted Successfully", 200));
  };

  // Get All Posts
  getAllPosts = async (req: Request, res: Response) => {
    const posts = await this.postRepo.findDocuments({});
    if (!posts || posts.length === 0)
      throw new NotFoundException("No Posts Found");

    return res.json(SuccessResponse("Posts Fetched Successfully", 200, posts));
  };

  // Remove Inappropriate Post
  removePost = async (req: Request, res: Response) => {
    const { id: postId } = req.params;

    const deletedPost = await this.postRepo.deleteByIdDocument(postId);
    if (!deletedPost) throw new NotFoundException("Post Not Found");

    return res.json(SuccessResponse("Post Deleted Successfully", 200));
  };
}

export default new AdminService();
