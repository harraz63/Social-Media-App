import { Socket } from "socket.io";
import { ConversationModel, MessageModel } from "../../../DB/Models";
import {
  ConversationRepository,
  MessageRepository,
} from "../../../DB/Repositories";
import mongoose from "mongoose";
import { getIo } from "../../../Gateways/socketIo.gateway";

export class ChatService {
  conversationRepo: ConversationRepository = new ConversationRepository(
    ConversationModel
  );
  messageRepo: MessageRepository = new MessageRepository(MessageModel);

  async joinPrivateChat(socket: Socket, targetUserId: string) {
    // Sort member IDs to ensure consistent ordering
    const sortedMembers = [socket.data.user._id.toString(), targetUserId]
      .sort()
      .map((id) => new mongoose.Types.ObjectId(id));

    let conversation = await this.conversationRepo.findOneDocument({
      type: "direct",
      members: { $all: sortedMembers, $size: 2 },
    });

    if (!conversation) {
      try {
        conversation = await this.conversationRepo.createNewDocument({
          type: "direct",
          members: sortedMembers,
        });
      } catch (error: any) {
        // Handle duplicate key error (race condition)
        if (error.code === 11000) {
          // Duplicate key error, fetch the existing conversation
          conversation = await this.conversationRepo.findOneDocument({
            type: "direct",
            members: { $all: sortedMembers, $size: 2 },
          });
        } else {
          throw error;
        }
      }
    }

    socket.join(conversation!._id!.toString());
    return conversation!;
  }

  async sendPrivateMessage(socket: Socket, data: unknown) {
    const { text, targetUserId } = data as {
      text: string;
      targetUserId: string;
    };
    const conversation = await this.joinPrivateChat(socket, targetUserId);

    // Create Message
    const message = await this.messageRepo.createNewDocument({
      text,
      conversationId: conversation._id as mongoose.Types.ObjectId,
      senderId: socket.data.user._id,
    });

    getIo()?.to(conversation._id!.toString()).emit("message-sent", message);
  }

  async getConversationMessages(socket: Socket, targetUserId: string) {
    const conversation = await this.joinPrivateChat(socket, targetUserId);

    const messages = await this.messageRepo.findDocuments({
      conversationId: conversation._id,
    });
    socket.emit("chat-history", messages);
  }

  async joinChatGroup(socket: Socket, targetGroupId: string) {
    let conversation = await this.conversationRepo.findOneDocument({
      _id: targetGroupId,
      type: "group",
    });
    if (!conversation) {
      throw new Error("Group not found");
    }
    socket.join(conversation._id!.toString());
    return conversation;
  }

  async sendGroupMessage(socket: Socket, data: unknown) {
    const { text, targetGroupId } = data as {
      text: string;
      targetGroupId: string;
    };
    const conversation = await this.joinChatGroup(socket, targetGroupId);

    // Create Message
    const message = await this.messageRepo.createNewDocument({
      text,
      conversationId: conversation._id as mongoose.Types.ObjectId,
      senderId: socket.data.user._id,
    });

    getIo()?.to(conversation._id!.toString()).emit("message-sent", message);
  }

  async getGroupHistory(socket: Socket, targetGroupId: string) {
    const messages = await this.messageRepo.findDocuments({
      conversationId: targetGroupId,
    });
    socket.emit("group-chat-history", messages);
  }
}
