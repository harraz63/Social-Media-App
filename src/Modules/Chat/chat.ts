import { Socket } from "socket.io";
import { ChatEvents } from "./chat.events";

export const ChatInitiation = (socket: Socket) => {
  const chatEvents = new ChatEvents(socket);

  chatEvents.sendPrivateMessageEvent();
  chatEvents.getChatHistoryEvent();
  chatEvents.sendGroupMessageEvent();
  chatEvents.getGroupHistoryEvent();
};