import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import * as controllers from "./Modules/controllers.index";
import dbConnection from "./DB/db.connection";
import { HttpException } from "./Utils";
import { FailedResponse } from "./Utils/Response/response-helper.utils";
import { syncCommentsCounterJob } from "./Jobs";

const app = express();
app.use(express.json());

dbConnection();

// Run cron jobs
syncCommentsCounterJob();

app.use("/api/auth", controllers.authController);
app.use("/api/users", controllers.profileController);
app.use("/api/admin", controllers.adminController);
app.use("/api/posts", controllers.postsController);
app.use("/api/comments", controllers.commentsController);
app.use("/api/reacts", controllers.reactsController);

// Global Error Handling Middleware
app.use(
  (
    err: HttpException | Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (err instanceof HttpException) {
      res.status(err.statusCode).json(
        FailedResponse(err.message, err.statusCode, {
          message: err.message,
        })
      );
    } else {
      res.status(500).json(
        FailedResponse("Something Went Wrong!", 500, {
          message: err.message,
          stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        })
      );
    }
  }
);

const port: number | string = process.env.PORT || 3000;
app.listen(port);
