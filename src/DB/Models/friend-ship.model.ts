import mongoose from "mongoose";
import { FriendShipStatusEnum } from "../../Common/Enums";
import { IFriendShip } from "../../Common/Interfaces";

const friendShipSchema = new mongoose.Schema<IFriendShip>({
  requstFromId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  requstToId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: FriendShipStatusEnum,
    default: FriendShipStatusEnum.PENDING,
  },
});

const FriendShipModel = mongoose.model<IFriendShip>(
  "FriendShip",
  friendShipSchema
);

export { FriendShipModel };
