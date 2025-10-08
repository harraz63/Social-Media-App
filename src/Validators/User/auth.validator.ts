import * as z from "zod";
import { GenderEnum } from "../../Common/Enums";

export const signupSchema = {
  body: z
    .strictObject({
      firstName: z
        .string()
        .min(3, "First Name Must Be At Least 3 Characters")
        .max(10, "First Name Must Be Shorter Than 10 Characters"),
      lastName: z
        .string()
        .min(3, "Last Name Must Be At Least 3 Characters")
        .max(10, "Last Name Must Be Shorter Than 10 Characters"),
      email: z.email(),
      password: z
        .string()
        .min(8)
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          "Password Must Contain Uppercase, Lowercase, Number, And Special Character"
        ),
      rePassword: z.string(),
      gender: z.enum(GenderEnum, { message: "Invalid Gender" }),
      
      // Preprocess DOB string to Date, optional
      DOB: z.preprocess(
        (arg) => {
          if (typeof arg === "string") return new Date(arg);
          return arg;
        },
        z.date().optional()
      ),

      age: z.number().min(18).max(120),
      phoneNumber: z
        .string()
        .length(11, "Phone Number Must Be Exactly 11 Digits")
        .regex(/^\d+$/, { message: "Phone Number Must Contain Only Numbers" }),
    })
    .superRefine((data, ctx) => {
      // Password match check
      if (data.password !== data.rePassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords Do Not Match",
          path: ["rePassword"],
        });
      }

      // DOB and age check (at least 13 years old)
      if (data.DOB) {
        const today = new Date();
        let age = today.getFullYear() - data.DOB.getFullYear();
        const monthDiff = today.getMonth() - data.DOB.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < data.DOB.getDate())) {
          age--;
        }
        if (age < 13) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "You must be at least 13 years old to sign up",
            path: ["DOB"],
          });
        }
      }
    }),
};

export type SignupInputType = z.infer<typeof signupSchema.body>;
