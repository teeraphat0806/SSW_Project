import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { minioClient } from "@/lib/minio";
import prisma from "@/lib/prisma";

const BUCKET = process.env.MINIO_BUCKET;
export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!BUCKET) {
      return NextResponse.json(
        { error: "MINIO_BUCKET is not set" },
        { status: 500 },
      );
    }

    const { id } = await context.params;
    const idPo = Number(id);
    if (isNaN(idPo)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const orderPo = await prisma.orderPO.findUnique({
      where: { id: idPo },
      select: { codetoinvoice: true },
    });
    if (!orderPo) {
      return NextResponse.json(
        { error: "Order PO not found" },
        { status: 404 },
      );
    }
    const invoice = await prisma.invoice.findFirst({
      where: { codetoinvoice: orderPo.codetoinvoice },
    });

    if (invoice) {
      return NextResponse.json(
        { error: "Cannot delete PO linked to an invoice" },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => null);
    const key = body?.key as string | undefined;

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    await minioClient.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
    );

    return NextResponse.json({ ok: true, key }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
