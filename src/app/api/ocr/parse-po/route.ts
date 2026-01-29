import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CuttingMethod, ShapeSteel } from "@prisma/client";
import { email } from "zod";

export const runtime = "nodejs"; // ต้องใช้ node runtime สำหรับ file + fetch

const onlyDigits = (str: string | null) => (str ? str.replace(/\D/g, "") : "");
const safe = (str?: string | null) => (str ?? "").trim();
const asNullIfEmpty = (str: string) => (str.trim() ? str.trim() : null);

type OcrUpstreamResponse = {
  result: {
    header: {
      poNumber: string | null;
      poDate: string | null;
      deliveryDate: string | null;
      yourRef: string | null;
      customer: {
        name: string | null;
        taxNumber: string | null;
        tel: string | null;
        email: string | null;
        faxNumber: string | null;
        address: string | null;
        code: string | null;
      };
    };
    items: Array<{
      codeSteel: string | null;
      description: string | null;
      shape: ShapeSteel | string | null;
      width: number | null;
      length: number | null;
      thickness: number | null;
      quantity: number | null;
      cuttingMethod: CuttingMethod | string | null;
      job: number | null;
      notes: string | null;
      matchedSteelTypeId: number | null;
      confidence: number | null;
    }>;
    meta?: {
      confidence?: number;
      warnings?: string[];
    };
  };
};

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const files = form.getAll("files");
    const first = files?.[0];

    if (!first || !(first instanceof File)) {
      return NextResponse.json(
        { error: "กรุณาแนบไฟล์ (field name: files)" },
        { status: 400 },
      );
    }

    //----1. ส่งไฟล์ไปยัง OCR upstream ----
    const ocrUrl = process.env.OCR_API_URL;
    const token = process.env.OCR_API_TOKEN;

    if (!ocrUrl) {
      return NextResponse.json(
        { error: "OCR_API_URL is not configured on the server" },
        { status: 500 },
      );
    }
    if (!token) {
      return NextResponse.json(
        { error: "OCR_API_TOKEN is not configured on the server" },
        { status: 500 },
      );
    }

    const upstreamForm = new FormData();
    upstreamForm.append("file", first); // ถ้า upstream ต้องการ "files" ให้เปลี่ยนเป็น files

    const upstreamRes = await fetch(ocrUrl, {
      method: "POST",
      headers: {
        "X-API-Token": token,
      },
      body: upstreamForm,
    });

    const upstreamJson: Partial<OcrUpstreamResponse> = await upstreamRes
      .json()
      .catch(() => ({}));

    if (!upstreamRes.ok || !upstreamJson.result) {
      return NextResponse.json(
        {
          error: "ไม่สามารถประมวลผลไฟล์ได้ กรุณาลองใหม่ภายหลัง",
          details: upstreamJson,
        },
        { status: 502 },
      );
    }

    const result = upstreamJson.result;

    //----2. ส่ง response กลับ----

    const customerDraft = {
      code: result.header.customer.code ?? null,
      name: safe(result.header.customer.name),
      address: safe(result.header.customer.address),
      tel: onlyDigits(result.header.customer.tel) ?? "",
      taxNumber: onlyDigits(result.header.customer.taxNumber) ?? null,
      faxNumber: onlyDigits(result.header.customer.faxNumber) ?? null,
      email: safe(result.header.customer.email) ?? null,
    };

    const orderDraft = {
      ponumber: asNullIfEmpty(safe(result.header.poNumber)),
      poDate: asNullIfEmpty(safe(result.header.poDate)),
      deliveryDate: asNullIfEmpty(safe(result.header.deliveryDate)),
      yourRef: asNullIfEmpty(safe(result.header.yourRef)),
    };

    const customerOR: any[] = [];
    if (customerDraft.email) customerOR.push({ email: customerDraft.email });
    if (customerDraft.tel) customerOR.push({ tel: customerDraft.tel });
    if (customerDraft.taxNumber)
      customerOR.push({ taxNumber: customerDraft.taxNumber });
    if (customerDraft.faxNumber)
      customerOR.push({ faxNumber: customerDraft.faxNumber });

    let customerMatch: {
      matched: boolean;
      customerId: number | null;
      matchedBy: "taxNumber" | "tel" | "faxNumber" | "email" | null;
    } = { matched: false, customerId: null, matchedBy: null };

    if (customerOR.length > 0) {
      const foundCustomer = await prisma.customer.findFirst({
        where: { OR: customerOR },
        select: {
          id: true,
          taxNumber: true,
          tel: true,
          faxNumber: true,
          email: true,
        },
      });

      if (foundCustomer) {
        const matchedBy =
          (customerDraft.taxNumber &&
            foundCustomer.taxNumber === customerDraft.taxNumber &&
            "taxNumber") ||
          (customerDraft.tel &&
            foundCustomer.tel === customerDraft.tel &&
            "tel") ||
          (customerDraft.faxNumber &&
            foundCustomer.faxNumber === customerDraft.faxNumber &&
            "faxNumber") ||
          (customerDraft.email &&
            foundCustomer.email === customerDraft.email &&
            "email") ||
          null;
        customerMatch = {
          matched: true,
          customerId: foundCustomer.id,
          matchedBy,
        };
      }
    }

    const rawCodes = result.items
      .map((it) => safe(it.codeSteel))
      .filter(Boolean);

    // query steelTypes ที่ match
    const steelTypeRows =
      rawCodes.length > 0
        ? await prisma.steelType.findMany({
            where: { codeSteel: { in: rawCodes } },
            select: { id: true, codeSteel: true, shape: true, status: true },
          })
        : [];

    const steelMap = new Map<string, { id: number; codeSteel: string }>();

    for (const steel of steelTypeRows)
      steelMap.set(steel.codeSteel, {
        id: steel.id,
        codeSteel: steel.codeSteel,
      });

    const items = result.items.map((it) => {
      const codeSteel = safe(it.codeSteel);
      const matchedSteel = codeSteel ? steelMap.get(codeSteel) : null;

      // normalize shape and cuttingMethod
      const shape = (it.shape as ShapeSteel) || "square";
      const cuttingMethod = (it.cuttingMethod as CuttingMethod) || "normal";

      return {
        raw: {
          codeSteel: codeSteel || null,
          description: it.description ?? null,
          shape,
          width: it.width ?? null,
          length: it.length ?? null,
          thickness: it.thickness ?? null,
          quantity: it.quantity ?? null,
          cuttingMethod,
          job: it.job ?? null,
          notes: it.notes ?? null,
          confidence: it.confidence ?? null,
        },
        match: {
          matched: !!matchedSteel,
          steelTypeId: matchedSteel?.id ?? null,
          matchedBy: matchedSteel ? "codeSteel" : null,
        },
      };
    });

    return NextResponse.json({
      source: {
        fileName: first.name,
        fileSize: first.size,
        fileType: first.type,
      },
      customerMatch,
      customerDraft,
      orderDraft,
      items,
      meta: {
        warnings: result.meta?.warnings || [],
        confidence: result.meta?.confidence || null,
      },
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
