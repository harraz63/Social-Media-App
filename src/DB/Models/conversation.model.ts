import mongoose, { Types } from "mongoose";
import { IConversation } from "../../Common/Interfaces";

const conversationSchema = new mongoose.Schema<IConversation>({
  type: {
    type: String,
    default: "direct",
    enum: ["direct", "group"],
  },
  name: String as any,
  members: [{ type: Types.ObjectId, ref: "User" }],
});

// IMPORTANT: Sort members before saving to ensure consistent ordering
conversationSchema.pre("save", function (next) {
  if (this.type === "direct" && this.members && this.members.length === 2) {
    // Sort members array to ensure [userA, userB] is always in same order
    this.members.sort((a, b) => a.toString().localeCompare(b.toString()));
  }
  next();
});

// Create compound unique index for direct conversations
conversationSchema.index(
  { type: 1, members: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "direct" },
  }
);

const ConversationModel = mongoose.model<IConversation>(
  "Conversations",
  conversationSchema
);

export { ConversationModel };
