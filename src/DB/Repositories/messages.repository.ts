import { Model } from "mongoose";
import { BaseRepository } from "./base.repository";
import { IMessage } from "../../Common/Interfaces";

export class MessageRepository extends BaseRepository<IMessage> {
  constructor(protected _messageModel: Model<IMessage>) {
    super(_messageModel);
  }

}
