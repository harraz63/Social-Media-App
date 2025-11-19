import * as z from "zod";
import { GenderEnum } from "../../Common/Enums";

// Signup Schema
export const signupSchema = {
  body: z
    .object({
      firstName: z
        .string()
        .min(3, "First Name Must Be At Least 3 Characters")
        .max(10, "First Name Must Be Shorter Than 10 Characters"),
      lastName: z
        .string()
        .min(3, "Last Name Must Be At Least 3 Characters")
        .max(10, "Last Name Must Be Shorter Than 10 Characters"),
      email: z.string().email("Invalid Email Format"),
      password: z
        .string()
        .min(8)
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          "Password Must Contain Uppercase, Lowercase, Number, And Special Character"
        ),
      rePassword: z.string(),
      gender: z.enum(GenderEnum, { message: "Invalid Gender" }),
      DOB: z.preprocess((arg) => {
        if (typeof arg === "string") return new Date(arg);
        return arg;
      }, z.date().optional()),
      age: z.number().min(18).max(120),
      phoneNumber: z
        .string()
        .length(11, "Phone Number Must Be Exactly 11 Digits")
        .regex(/^\d+$/, { message: "Phone Number Must Contain Only Numbers" }),
    })
    .strict() // Use .strict() method instead of strictObject
    .superRefine((data, ctx) => {
      // Password match check
      if (data.password !== data.rePassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords Do Not Match",
          path: ["rePassword"],
        });
      }

      // DOB and age check
      if (data.DOB) {
        const today = new Date();
        let age = today.getFullYear() - data.DOB.getFullYear();
        const monthDiff = today.getMonth() - data.DOB.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < data.DOB.getDate())
        ) {
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

// Signin Schema
export const signinSchema = {
  body: z.strictObject({
    email: z.string().email("Invalid Email Format"),
    password: z.string().min(1, "Password Is Required"),
  }),
};

// Confirm Email Schema
export const confirmEmailSchema = {
  body: z.strictObject({
    email: z.string().email("Invalid Email Format"),
    otp: z
      .string()
      .length(5, "OTP Must Be Exactly 5 Digits")
      .regex(/^\d+$/, "OTP Must Contain Only Numbers"),
  }),
};

// Forget Password Schema
export const forgetPasswordSchema = {
  body: z.strictObject({
    email: z.string().email("Invalid Email Format"),
  }),
};

// Reset Password Schema
export const resetPasswordSchema = {
  body: z.strictObject({
    email: z.string().email("Invalid Email Format"),
    otp: z
      .string()
      .length(5, "OTP Must Be Exactly 5 Digits")
      .regex(/^\d+$/, "OTP Must Contain Only Numbers"),
    newPassword: z
      .string()
      .min(8, "Password Must Be At Least 8 Characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password Must Contain Uppercase, Lowercase, Number, And Special Character"
      ),
  }),
};
