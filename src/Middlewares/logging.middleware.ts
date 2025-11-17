import chalk from "chalk";
import { NextFunction, Request, Response } from "express";
import { IRequest } from "../Common/Interfaces";

export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = process.hrtime.bigint();
  const method = req.method;
  const url = req.originalUrl || req.url;

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    const status = res.statusCode;

    const coloredMethod = chalk.cyan(method);
    const coloredStatus =
      status >= 500
        ? chalk.red(status.toString())
        : status >= 400
        ? chalk.yellow(status.toString())
        : chalk.green(status.toString());

    const userId = (req as unknown as IRequest)?.loggedInUser?.user?._id;
    const userStr = userId
      ? chalk.magenta(`[user:${userId}]`)
      : chalk.gray("[guest]");

    const msg = `${coloredMethod} ${chalk.white(
      url
    )} ${coloredStatus} ${chalk.gray(`${durationMs.toFixed(1)}ms`)} ${userStr}`;

    // Output to console only; file logging handled by morgan
    console.log(msg);
  });

  next();
};
