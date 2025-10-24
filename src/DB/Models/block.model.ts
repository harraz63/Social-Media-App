import mongoose, { Schema } from "mongoose";

const BlockSchema = new mongoose.Schema(
  {
    blockerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    blockedId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

BlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

const BlockModel = mongoose.model("Block", BlockSchema);

export { BlockModel };
