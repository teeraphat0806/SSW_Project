// app/api/nl2sql/route.ts
// ใหม่: นำเข้า helpers จาก lib เพื่อให้ไฟล์นี้มีเฉพาะ route handler ที่ Next.js คาดหวัง
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
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

    // 1) ขอ SQL จาก OpenRouter (helper ใน lib)
    const rawSql = await callOpenRouter(userQuery);

    // 2) ตรวจความปลอดภัย
    // const safe = looksSafeSelect(rawSql);
    // if (!safe.ok) {
    //   return NextResponse.json(
    //     {
    //       error: "Rejected unsafe SQL",
    //       reason: safe.reason,
    //       generatedSql: rawSql,
    //     },
    //     { status: 400 }
    //   );
    // }

    // 3) (ออปชัน) รันจริง — เปิดใช้เมื่อพร้อม
    // const rows = await prisma.$queryRawUnsafe(rawSql);

    // 4) ส่งกลับ
    // return NextResponse.json({
    //   ok: true,
    //   sql: rawSql,
    //   // result: rows, // เปิดคอมเมนต์เมื่อรันจริง
    // });
    const response = await GETSQL(rawSql);

    if (Array.isArray(response)) {
      const rowWithUrlPo = response.find(
        (row) =>
          row &&
          Array.isArray(row.urlPo) &&
          row.urlPo.length > 0 &&
          typeof row.urlPo[0] === "string"
      );

      if (rowWithUrlPo) {
        const filePath = rowWithUrlPo.urlPo[0].replace(/^\/+/, "");
        const openPoUrl = `${process.env.NEXTAUTH_URL}/api/upload/po/openPo/${filePath}`;

        const openPoResp = await fetch(openPoUrl, { method: "GET" });

        if (!openPoResp.ok) {
          const errText = await openPoResp.text().catch(() => "");
          throw new Error(`openPo error ${openPoResp.status}: ${errText}`);
        }

        // อ่านเป็น binary (PDF)
        const pdfBuffer = await openPoResp.arrayBuffer();

        return new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            "Content-Type":
              openPoResp.headers.get("content-type") || "application/pdf",
            // ถ้าปลายทางมี Content-Disposition อยู่แล้วจะดึงมาใช้ต่อ
            "Content-Disposition":
              openPoResp.headers.get("content-disposition") || "inline",
          },
        });
      }
    }

    // กรณีไม่มี urlPo → ค่อย narrate ตามปกติ (helper ใน lib)
    const narration = await narrateArrayWithOpenRouter(
      Array.isArray(response) ? response : [response]
    );

    return NextResponse.json({
      sql: rawSql,
      result: narration,
    });
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    // fallback กรณีไม่ใช่ Error เช่น string, object แปลก ๆ
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
