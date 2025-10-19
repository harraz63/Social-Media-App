const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    text: String,
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversations",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    attachments: [String],
  },
  {
    timestamps: true,
  }
);

const MessageModel = mongoose.model("Messages", messageSchema);

export { MessageModel };
