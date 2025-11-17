import { BadRequestException } from "../Utils/Errors/exceptions.utils";
import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

type RequestKeyType = keyof Request;
type SchemaType = Partial<Record<RequestKeyType, ZodType>>;
type ValidationErrorType = {
  key: RequestKeyType;
  issues: {
    path: PropertyKey[];
    message: string;
  }[];
};

// Validation Middleware
export const validationMiddleware = (schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const reqKeys: RequestKeyType[] = ["body", "params", "query", "headers"];

    const validationErrors: ValidationErrorType[] = [];

    // Validation Loop
    for (const key of reqKeys) {
      if (schema[key]) {
        const result = schema[key].safeParse(req[key]);
        if (!result?.success) {
          // save all issues in issues array
          const issues = result.error?.issues?.map((issue) => ({
            path: issue.path,
            message: issue.message,
          }));
          // push issues to validationErrors array
          validationErrors.push({ key, issues });
        }
      }
    }

    // throw error if validationErrors array is not empty
    if (validationErrors.length)
      throw new BadRequestException("Validation Failed", { validationErrors });

    next();
  };
};
