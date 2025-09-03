import {S3Client} from "@aws-sdk/client-s3";

export const minioClient = new  S3Client({
    endpoint: process.env.MINIO_ENDPOINT,
    region: process.env.MINIO_REGION || "us-east-1",
    credentials:{
        accessKeyId: process.env.MINIO_ACCESS_KEY,
        secretAccessKey: process.env.MINIO_SECRET_KEY
    },
    forcePathStyle: true
});