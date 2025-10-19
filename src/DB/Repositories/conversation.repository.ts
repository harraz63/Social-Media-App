import { Model } from "mongoose";
import { IConversation } from "../../Common/Interfaces";
import { BaseRepository } from "./base.repository";

export class ConversationRepository extends BaseRepository<IConversation> {
  constructor(protected _conversationModel: Model<IConversation>) {
    super(_conversationModel);
  }

  // // Find a direct conversation between exactly two users
  // async findDirectConversation(
  //   userId1: Types.ObjectId,
  //   userId2: Types.ObjectId
  // ): Promise<IConversation | null> {
  //   return this.findOneDocument({
  //     type: "direct",
  //     // exactly the two members
  //     members: { $all: [userId1, userId2], $size: 2 },
  //   } as any);
  // }

  // // Create a direct conversation between two users (idempotent if caller checks first)
  // async createDirectConversation(
  //   userId1: Types.ObjectId,
  //   userId2: Types.ObjectId
  // ): Promise<IConversation> {
  //   return ConversationModel.create({
  //     type: "direct",
  //     members: [userId1, userId2],
  //   } as any);
  // }

  // // Create a group conversation with a name and members
  // async createGroupConversation(
  //   name: string,
  //   memberIds: Types.ObjectId[]
  // ): Promise<IConversation> {
  //   return ConversationModel.create({
  //     type: "group",
  //     name,
  //     members: memberIds,
  //   } as any);
  // }

  // // Get all conversations for a user (populated members)
  // getAllUserConversations(
  //   userId: Types.ObjectId
  // ): Query<IConversation[], IConversation> {
  //   return (
  //     ConversationModel.find({ members: userId })
  //       .populate("members", "firstName lastName profilePicture _id")
  //       // sort by creation time proxy
  //       .sort({ _id: -1 })
  //   );
  // }

  // // Find conversation by ID with populated members
  // findConversationByIdWithMembers(
  //   conversationId: Types.ObjectId | string
  // ): Query<IConversation | null, IConversation> {
  //   return ConversationModel.findById(conversationId).populate(
  //     "members",
  //     "firstName lastName profilePicture _id email"
  //   );
  // }
}
