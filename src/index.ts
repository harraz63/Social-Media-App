import "dotenv/config";
import * as controllers from "./Modules/controllers.index";
import dbConnection from "./DB/db.connection";
import { HttpException } from "./Utils";
import { FailedResponse } from "./Utils/Response/response-helper.utils";
import { syncCommentsCounterJob } from "./Jobs";
import { ioInitializer } from "./Gateways/socketIo.gateway";
import fs from "node:fs";
import { loggingMiddleware } from "./Middlewares";
import cors from "cors";
import morgan from "morgan";
import express, { NextFunction, Request, Response } from "express";

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);
app.use(express.json());
// Colorized request logging
app.use(loggingMiddleware);
// Create A Write Stream (in append mode)
let accessLogStream = fs.createWriteStream("access.log");
// Setup The Logger
app.use(morgan("dev", { stream: accessLogStream }));

dbConnection();

// Run cron jobs
syncCommentsCounterJob();

// Routes
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
        FailedResponse(err.message, err.statusCode, err.error || {
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

// Server
const port: number | string = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


// Initialize Socket.IO for the main server if no error
ioInitializer(server);
