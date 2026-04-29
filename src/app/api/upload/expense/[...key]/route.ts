import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { minioClient } from "@/lib/minio";

const BUCKET = "expensereciept";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ key: string[] }> },
) {
  try {
    const { key } = await context.params;
    const objectKey = key.join("/"); // "expense/1234567890_abcd_receipt.jpg"

    const res = await minioClient.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: objectKey,
      }),
    );

    if (!res.Body) {
      return NextResponse.json(
        { error: "MinIO response body is missing" },
        { status: 500 },
      );
    }

    const arrayBuffer = await new Response(
      res.Body as ReadableStream<Uint8Array>,
    ).arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": res.ContentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (e) {
    console.error("Error fetching expense receipt:", e);
    return NextResponse.json({ error: "Failed to get file" }, { status: 500 });
  }
}
