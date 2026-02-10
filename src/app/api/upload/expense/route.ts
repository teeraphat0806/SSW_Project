import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { minioClient } from "@/lib/minio";

const BUCKET = "expensereciept";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type (only images)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const rand = crypto.randomBytes(4).toString("hex");
    const timestamp = Date.now();
    const key = `expense/${timestamp}_${rand}_${safeName}`;

    await minioClient.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    return NextResponse.json(
      {
        message: "File uploaded successfully",
        key: key,
        url: `/api/upload/expense/${key}`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
