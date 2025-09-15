import { Model } from "mongoose";
import { IUser } from "../../Common/Interfaces";
import { BaseRepository } from "./base.repository";

export class UserRepository extends BaseRepository<IUser> {
  constructor(protected _usermodel: Model<IUser>) {
    super(_usermodel);
  }

  // Find User By Email
  async findUserByEmail(email: string): Promise<IUser | null> {
    return this.findOneDocument({ email });
  }

  // Delete User Along With Pictures
}
