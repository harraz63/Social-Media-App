import { EventEmitter } from "events";
import { IEmailArgument } from "../../Common/Interfaces";
import { Attachment } from "nodemailer/lib/mailer";
import nodemailer from "nodemailer";

export const sendEmail = async ({
  to,
  cc = "aharraz63unv@gmail.com",
  subject,
  content,
  attachments = [],
}: IEmailArgument) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.USER_PASSWORD,
    },
  });

  // Convert string[] (file paths) → Nodemailer Attachment[]
  const formattedAttachments: Attachment[] = attachments.map((filePath) => ({
    path: filePath,
  }));

  const info = await transporter.sendMail({
    from: process.env.USER_EMAIL, // safer than hardcoding
    to,
    cc,
    subject,
    html: content,
    attachments: formattedAttachments,
  });

  return info;
};

export const emmiter = new EventEmitter();
emmiter.on("sendEmail", (args: IEmailArgument) => {
  sendEmail(args);
});
