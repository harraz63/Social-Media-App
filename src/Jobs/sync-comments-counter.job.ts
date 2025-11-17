import cron from "node-cron";
import { PostModel } from "../DB/Models";
import { CommentModel } from "../DB/Models/comment.model";

// Sync Comments Counter Job
const syncCommentsCounterJob = () => {
  // cron job runs every hour "0 * * * *"
  cron.schedule("0 * * * *", async () => {
    console.log("🔄 [JOB] Syncing comments counters...");

    // sync comments counter for posts
    try {
      const posts = await PostModel.find();

      for (const post of posts) {
        const count = await CommentModel.countDocuments({
          refId: post._id,
          onModel: "Post",
        });
        await PostModel.findByIdAndUpdate(post._id, { commentsCounter: count });
      }

      console.log("✅ [JOB] Comments counters synced successfully");
    } catch (error) {
      console.error("❌ [JOB] Error syncing comments counters:", error);
    }
  });
};

export { syncCommentsCounterJob };
