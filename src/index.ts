import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import * as controllers from "./Modules/controllers.index";
import dbConnection from "./DB/db.connection";

const app = express();
app.use(express.json());

dbConnection();

app.use("/api/auth", controllers.authController);
app.use("/api/users", controllers.profileController);
app.use("/api/posts", controllers.postsController);
app.use("/api/comments", controllers.commentsController);
app.use("/api/reacts", controllers.reactsController);

// Global Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong!",
  });
});

const port: number | string = process.env.PORT || 5000;
app.listen(port);
