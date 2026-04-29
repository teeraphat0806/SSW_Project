// src/lib/minio.ts
import { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.MINIO_ENDPOINT;
const region = process.env.MINIO_REGION || "us-east-1";
const accessKeyId = process.env.MINIO_ACCESS_KEY;
const secretAccessKey = process.env.MINIO_SECRET_KEY;

if (!endpoint) {
  throw new Error("MINIO_ENDPOINT is not set");
}

if (!accessKeyId || !secretAccessKey) {
  throw new Error("MINIO_ACCESS_KEY or MINIO_SECRET_KEY is not set");
}

export const minioClient = new S3Client({
  endpoint, // ตอนนี้ type = string แน่นอนแล้ว
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});
