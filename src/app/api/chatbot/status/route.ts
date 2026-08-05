import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
  }

  try {
    const job = await prisma.chatJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      error: job.error,
      resultType: job.resultType,
      resultText: job.resultText,
      pdfKey: job.pdfKey,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการตรวจสอบสถานะ" },
      { status: 500 },
    );
  }
}
