// src/app/api/upload/po/openPo/[key]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { minioClient } from "@/lib/minio";

const BUCKET = process.env.MINIO_BUCKET;
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  try {
    if (!BUCKET) {
      return NextResponse.json(
        { error: "MINIO_BUCKET is not set" },
        { status: 500 }
      );
    }

    const { key } = await context.params;
    console.log("key:", key);
    const objectKey = key.join("/"); // "po/2/1764....pdf"
    //const fileName = key[key.length - 1];

    const res = await minioClient.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: objectKey,
      })
    );

    if (!res.Body) {
      return NextResponse.json(
        { error: "MinIO response body is missing" },
        { status: 500 }
      );
    }

    const arrayBuffer = await new Response(
      res.Body as ReadableStream<Uint8Array>
    ).arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": res.ContentType || "application/pdf",
        // ถ้าอยากให้โหลดเลย:
        //"Content-Disposition": `inline;filename="${encodeURIComponent(fileName)}"`
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to get file" }, { status: 500 });
  }
}
