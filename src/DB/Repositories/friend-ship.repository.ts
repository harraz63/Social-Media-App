import { Query, Types } from "mongoose";
import { IFriendShip } from "../../Common/Interfaces";
import { FriendShipModel } from "../Models";
import { BaseRepository } from "./base.repository";
import { FriendShipStatusEnum } from "../../Common/Enums";

export class FriendShipRepository extends BaseRepository<IFriendShip> {
  constructor() {
    super(FriendShipModel);
  }

  // Get All User Friends With Frinds Details
  getAllFriendShip(userId: Types.ObjectId): Query<IFriendShip[], IFriendShip> {
    return FriendShipModel.find({
      $or: [{ requestFromId: userId }, { requestToId: userId }],
      status: FriendShipStatusEnum.ACCEPTED,
    }).populate([
      { path: "requestFromId", select: "firstName lastName _id" },
      { path: "requestToId", select: "firstName lastName _id" },
    ]);
  }
}
