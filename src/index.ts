import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import * as controllers from "./Modules/controllers.index";
import dbConnection from "./DB/db.connection";
import { HttpException } from "./Utils";
import { FailedResponse } from "./Utils/Response/response-helper.utils";
import { syncCommentsCounterJob } from "./Jobs";
import { ioInitializer } from "./Gateways/socketIo.gateway";
import cors from "cors";
import morgan from "morgan";
import fs from "node:fs";

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);
app.use(express.json());
// Create A Write Stream (in append mode)
let accessLogStream = fs.createWriteStream("access.log");
// Setup The Logger
app.use(morgan("dev", { stream: accessLogStream }));

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
const server = app.listen(port);

ioInitializer(server);
