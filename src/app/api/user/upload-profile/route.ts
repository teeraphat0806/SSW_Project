import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getToken } from "next-auth/jwt";
import { minioClient } from "@/lib/minio";
import prisma from "@/lib/prisma";

const BUCKET = "userprofile";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(token.sub);
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Get file extension
    const ext = file.name.split(".").pop() || "jpg";
    const key = `${userId}.${ext}`;

    // Upload to MinIO
    await minioClient.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Build the MinIO URL path
    const imageUrl = `/api/user/profile-image/${key}`;

    // Update user image in database
    await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
    });

    return NextResponse.json(
      {
        message: "Profile image uploaded successfully",
        imageUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
