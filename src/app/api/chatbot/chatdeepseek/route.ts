// app/api/nl2sql/route.ts
// ใหม่: นำเข้า helpers จาก lib เพื่อให้ไฟล์นี้มีเฉพาะ route handler ที่ Next.js คาดหวัง
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import {
  narrateArrayWithOpenRouter,
  GETSQL,
  callOpenRouter,
} from "@/lib/chatbot-utils";

// ---------- 5) HANDLER ----------
export async function POST(req: NextRequest) {
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "delivery",
  ]);

  if ("response" in authResult) {
    return authResult.response;
  }
  const { session } = authResult;
  console.log(session);

  try {
    const body = await req.json();
    const userQuery: string = (body?.query || "").toString().trim();

    if (!userQuery) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    // สร้าง ChatJob บันทึกคิวงานสถานะ PROCESSING
    const job = await prisma.chatJob.create({
      data: {
        query: userQuery,
        status: "PROCESSING",
      },
    });

    // ประมวลผลดีพซีคเบื้องหลัง (Background Worker) แบบ Asynchronous
    (async () => {
      try {
        console.log("[Chatbot] User query:", userQuery);
        const rawSql = await callOpenRouter(userQuery);
        console.log("[Chatbot] Generated SQL:", rawSql);

        // อัปเดต SQL ที่ได้รับในระบบคิวงาน
        await prisma.chatJob.update({
          where: { id: job.id },
          data: { sql: rawSql },
        });

        const response = await GETSQL(rawSql);

        // กรณีตรวจสอบแล้วไม่มีข้อมูลผลลัพธ์
        if (!response || (Array.isArray(response) && response.length === 0)) {
          await prisma.chatJob.update({
            where: { id: job.id },
            data: {
              status: "COMPLETED",
              resultType: "text",
              resultText:
                "ไม่พบข้อมูลที่ตรงกับคำถามของคุณ อาจเป็นเพราะไม่มีข้อมูลในช่วงเวลาที่ระบุ หรือเงื่อนไขการค้นหาไม่ตรงกับข้อมูลในระบบ",
            },
          });
          return;
        }

        // กรณีมี urlPo (ดึงไฟล์เอกสาร PDF)
        if (Array.isArray(response)) {
          const rowWithUrlPo = response.find(
            (row) =>
              row &&
              Array.isArray(row.urlPo) &&
              row.urlPo.length > 0 &&
              typeof row.urlPo[0] === "string",
          );

          if (rowWithUrlPo) {
            const filePath = rowWithUrlPo.urlPo[0].replace(/^\/+/, "");
            // บันทึกที่อยู่ไฟล์ PO เพื่อให้ Frontend โหลดในภายหลัง (ไม่มี Loopback Fetch บนเซิร์ฟเวอร์หลัก)
            await prisma.chatJob.update({
              where: { id: job.id },
              data: {
                status: "COMPLETED",
                resultType: "pdf",
                pdfKey: filePath,
              },
            });
            return;
          }
        }

        // กรณีไม่มี urlPo → ทำการวิเคราะห์แปลความหมายข้อมูลขากลับเป็น Text
        const narration = await narrateArrayWithOpenRouter(
          Array.isArray(response) ? response : [response],
        );

        await prisma.chatJob.update({
          where: { id: job.id },
          data: {
            status: "COMPLETED",
            resultType: "text",
            resultText: narration,
          },
        });
      } catch (err) {
        console.error("[Chatbot] Background Error:", err);
        await prisma.chatJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            error: err instanceof Error ? err.message : String(err),
          },
        });
      }
    })();

    // ส่ง jobId กลับไปหาหน้าบ้านทันทีภายในไม่กี่มิลลิวินาที
    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: "PROCESSING",
    });
  } catch (error) {
    console.error("[Chatbot] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
