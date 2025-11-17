import { Model } from "mongoose";
import { IConversation } from "../../Common/Interfaces";
import { BaseRepository } from "./base.repository";

export class ConversationRepository extends BaseRepository<IConversation> {
  constructor(protected _conversationModel: Model<IConversation>) {
    super(_conversationModel);
  }
}
