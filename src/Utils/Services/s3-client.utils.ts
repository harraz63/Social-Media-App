import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import fs, { ReadStream } from "node:fs";

interface IPutObjectCommandInput extends PutObjectCommandInput {
  Body: string | Buffer | ReadStream;
}

export class S3ClientService {
  private s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });

  private Key_folder = process.env.AWS_KEY_FOLDER as string;

  async getFileWithSignedUrl(key: string) {
    const getCommand = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key: key,
    });

    const signedUrl = await getSignedUrl(this.s3Client, getCommand, {
      expiresIn: 3600,
    });

    return signedUrl;
  }

  async uploadFileOnS3(file: Express.Multer.File, key: string) {
    const keyName = `${this.Key_folder}/${key}/${Date.now()}-${
      file.originalname
    }`;
    console.log("The Key Name Is ", keyName);
    console.log("The File Into ", file);

    const params: IPutObjectCommandInput = {
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key: keyName,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
    };

    const putCommand = new PutObjectCommand(params);

    await this.s3Client.send(putCommand);
    const signUrl = await this.getFileWithSignedUrl(keyName);

    return {
      key: keyName,
      url: signUrl,
    };
  }

  async deleteFileFromS3(key: string) {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key: key,
    });

    return await this.s3Client.send(deleteCommand);
  }

  async deleteBulkFromS3(keys: string[]) {
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    });

    return await this.s3Client.send(deleteCommand);
  }

  async uploadLargeFileOnS3(file: Express.Multer.File, key: string) {
    const keyName = `${this.Key_folder}/${key}/${Date.now()}-${
      file.originalname
    }`;

    const params: PutObjectCommandInput = {
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key: keyName,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
    };

    const upload = new Upload({
      client: this.s3Client,
      params,
      queueSize: 4, // how many parts to upload in parallel
      partSize: 5 * 1024 * 1024, // each part = 5 MB
      leavePartsOnError: false, // auto-cleanup failed parts
    });

    upload.on("httpUploadProgress", (progress) => {
      console.log(`Uploaded ${progress.loaded} bytes of ${progress.total}`);
    });

    return await upload.done();
  }
}
