// app/api/nl2sql/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// ---------- 1) CONFIG ----------
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const OPENROUTER_MODEL = "deepseek/deepseek-chat-v3-0324";
const INTERNAL_SECRET = process.env.INTERNAL_SQL_API_SECRET!;

// ตารางและคอลัมน์ที่อนุญาต (ต้องตรงกับ Prisma schema)
const ALLOWED: Record<string, string[]> = {
  Bill: [
    "id",
    "customerId",
    "yourRef",
    "invoiceNo",
    "codeCustomer",
    "credit",
    "deliveryDate",
    "deliveryOrderNo",
    "salesName",
    "deliveredBy",
    "description",
    "vatRate",
    "subtotal",
    "grandTotal",
    "discount",
    "vat",
    "dateReceive",
    "typeBill",
    "salesNameId",
    "deliveredById",
    "updatedAt",
    "createdAt",
  ],
  Customer: [
    "id",
    "code",
    "name",
    "address",
    "tel",
    "taxNumber",
    "faxNumber",
    "email",
  ],
  OrderPO: [
    "id",
    "poNumber",
    "customerId",
    "assignedCutterId",
    "billId",
    "status",
    "total",
    "date",
    "completedAt",
    "urlPo",
  ],
  Product: [
    "id",
    "orderPOId",
    "steelId",
    "wide",
    "length",
    "thickness",
    "amount",
    "detail",
    "calculatedWeight",
    "actualWeight",
    "actualWide",
    "actualLength",
    "actualThickness",
    "total",
  ],
  Staff: [
    "id",
    "userId",
    "position",
    "bankAccount",
    "bankName",
    "startDate",
    "code",
    "social_security",
    "currentSalary",
    "updatedAt",
  ],
  StaffSalary: [
    "id",
    "staffId",
    "amount",
    "effectiveDate",
    "detail",
    "createdBy",
    "createdAt",
  ],
  StaffIncome: [
    "id",
    "amount",
    "nameIncome",
    "detail",
    "staffId",
    "date",
    "typeId",
  ],
  TypeStaffIncome: ["id", "amount", "name", "types"],
  SteelType: ["id", "codeSteel", "detail", "price", "createdAt", "updatedAt"],
  Expense: [
    "id",
    "description",
    "amount",
    "expenseDate",
    "categoryId",
    "receiptUrl",
    "createdAt",
    "updatedAt",
  ],
  ExpenseCategory: ["id", "name", "description"],
};

export async function narrateArrayWithOpenRouter(
  dataArray: unknown[]
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    throw new Error("Invalid or empty data array");
  }

  // จำกัดจำนวนแถวไม่ให้ยาวเกิน (กัน prompt ยาว)
  const MAX_ROWS = 10;
  const sample = dataArray.slice(0, MAX_ROWS);
  const truncatedNote =
    dataArray.length > MAX_ROWS
      ? `\n\n(มีข้อมูลทั้งหมด ${dataArray.length} แถว แสดงตัวอย่าง ${MAX_ROWS} แถวแรก)`
      : "";

  const userPrompt = [
    "ช่วยเรียบเรียงข้อมูลที่ให้ไปนี้ให้อยู่ในรูปแบบพรรณนาหรืออธิบายข้อมูลแบบเข้าใจง่าย เป็นภาษาไทย",
    "ให้คงรายละเอียดสำคัญ เช่น ชื่อ, ที่อยู่, หมายเลขโทรศัพท์, เลขประจำตัวผู้เสียภาษี, อีเมล เป็นต้น",
    "ห้ามแต่งเติมข้อมูลที่ไม่มีอยู่จริง หรือสรุปเกินจากข้อมูลที่ให้มา",
    "",
    "ข้อมูล:",
    JSON.stringify(sample, null, 2) + truncatedNote,
  ].join("\n");

  const messages = [
    {
      role: "system",
      content:
        "คุณเป็นผู้ช่วยที่เชี่ยวชาญในการอธิบายข้อมูลเชิงธุรกิจและลูกค้า หน้าที่ของคุณคือพรรณนา/เรียบเรียงข้อมูลให้อ่านง่าย เหมือนอธิบายให้ผู้อ่านทั่วไปเข้าใจได้ ไม่ต้องใช้คำทางเทคนิคมากเกินไป ให้ใช้ภาษาไทยล้วน ๆ",
    },
    { role: "user", content: userPrompt },
  ];

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      // "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
      // "X-Title": "Customer Data Narration",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 600,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenRouter error: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  const text: string = data?.choices?.[0]?.message?.content?.trim?.() ?? "";
  if (!text) throw new Error("Empty response from OpenRouter");
  return text;
}
// แผนที่ชื่อคอลัมน์ -> ตาราง (ช่วยเช็ค disambiguation เวลาเจอ "id" ในหลายตาราง)
// const COLUMN_TO_TABLES: Record<string, string[]> = Object.entries(
//   ALLOWED
// ).reduce<Record<string, string[]>>((acc, [table, cols]) => {
//   cols.forEach((c) => {
//     (acc[c] ||= []).push(table);
//   });
//   return acc;
// }, {});

// ---------- 2) SAFETY GUARD ----------
// const DANGEROUS = [
//   /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|comment)\b/i,
//   /--|\/\*|\*\//, // comments
//   /;/, // multiple statements
//   /\bpg_sleep\s*\(/i, // time-based
//   /\bcopy\s+\w+\s+to\b/i, // exfiltration
// ];

// function looksSafeSelect(sql: string) {
//   const s = sql.trim();

//   // ต้องเริ่มด้วย SELECT (หรือ WITH ... SELECT)
//   const startsWithSelectOrWith =
//     /^\s*(select|with)\b/i.test(s) && /select\b/i.test(s);
//   if (!startsWithSelectOrWith)
//     return { ok: false, reason: "Query is not SELECT/WITH" };

//   // ห้าม ; และ comments
//   for (const pat of DANGEROUS) {
//     if (pat.test(s))
//       return { ok: false, reason: "Dangerous token or comment found" };
//   }

//   // อนุญาตตารางที่กำหนดเท่านั้น (ชื่อ table ต้องมีเครื่องหมายคำพูดคู่เพราะใช้ camelCase)
//   const tableNames = Object.keys(ALLOWED);
//   const tblRegex =
//     /from\s+("?)([A-Za-z_][A-Za-z0-9_]*)\1|join\s+("?)([A-Za-z_][A-Za-z0-9_]*)\3/gi;
//   let m: RegExpExecArray | null;
//   const seenTables = new Set<string>();
//   while ((m = tblRegex.exec(s))) {
//     const t = (m[2] || m[4]) ?? "";
//     seenTables.add(t);
//   }
//   for (const t of seenTables) {
//     if (!tableNames.includes(t)) {
//       return { ok: false, reason: `Disallowed table: ${t}` };
//     }
//   }

//   // ตรวจคอลัมน์แบบหยาบ ๆ: หา "Table"."column" หรือ "column" เดี่ยว ๆ
//   // (อนุญาต function/aggregation ได้, ตรวจเฉพาะคีย์เวิร์ดปกติ)
//   const colRegex =
//     /"([A-Za-z_][A-Za-z0-9_]*)"\."([A-Za-z_][A-Za-z0-9_]*)"|"(?:[A-Za-z_][A-Za-z0-9_]*)"/g;
//   let mc: RegExpExecArray | null;
//   while ((mc = colRegex.exec(s))) {
//     if (mc[1] && mc[2]) {
//       // รูป "Table"."column"
//       const table = mc[1];
//       const col = mc[2];
//       if (!ALLOWED[table]?.includes(col)) {
//         return { ok: false, reason: `Disallowed column ${table}.${col}` };
//       }
//     } else if (mc[0]) {
//       // รูป "identifier" เดี่ยว เช่น "id" ใน SELECT
//       const ident = mc[0].slice(1, -1);
//       // ถ้าระบุเดี่ยว ๆ ต้องแน่ใจว่าเป็นคอลัมน์ที่ทุกตารางไม่มี collision หรือมี USING alias/qualify
//       const tables = COLUMN_TO_TABLES[ident] || [];
//       // ผ่อนผัน: ถ้า collides หลายตาราง แต่ใน query ใช้ตารางเดียว ก็โอเค
//       if (tables.length > 1 && seenTables.size > 1) {
//         // แนะนำให้ model ใส่ qualifier แล้ว — ที่นี่เราตีตก
//         return {
//           ok: false,
//           reason: `Ambiguous column "${ident}" without table qualifier`,
//         };
//       }
//       // ถ้าไม่มีตารางไหนมีเลย ก็ผิด
//       if (tables.length === 0) {
//         return { ok: false, reason: `Unknown identifier "${ident}"` };
//       }
//     }
//   }

//   return { ok: true, reason: "OK" };
// }

// // ---------- 3) SCHEMA CONTEXT (ให้โมเดลอ่าน) ----------
// const SCHEMA_CONTEXT = `
// You are an NL2SQL generator for PostgreSQL. Use ONLY these tables and columns.
// - Use **double quotes** for every identifier (tables, columns, aliases) because schema uses camelCase.
// - Output ONLY ONE SQL statement, **no code fences**, no explanation.
// - Return **read-only SELECT** (or WITH ... SELECT). Absolutely no DDL/DML.

// Tables (columns):
// ${Object.entries(ALLOWED)
//   .map(([t, cols]) => `- "${t}" (${cols.map((c) => `"${c}"`).join(", ")})`)
//   .join("\n")}

// Business hints:
// - "ยอดขาย" = usually sum of "grandTotal" from "Bill" or sum of "total" from "OrderPO" depending on user wording.
// - Dates:
//   - Use "date" (OrderPO), "deliveryDate" (Bill), "createdAt" (Bill/Expense), "expenseDate" (Expense)
//   - For month filters in Thai (เช่น "มกราคม" = January) map to month number; use date_trunc or EXTRACT(MONTH FROM ...).
// - Relationships:
//   - "Bill"."customerId" -> "Customer"."id"
//   - "OrderPO"."customerId" -> "Customer"."id"
//   - "OrderPO"."billId" -> "Bill"."id"
//   - "Product"."orderPOId" -> "OrderPO"."id"
//   - "Product"."steelId" -> "SteelType"."id"
//   - "StaffIncome"."typeId" -> "TypeStaffIncome"."id"
//   - "Expense"."categoryId" -> "ExpenseCategory"."id"

// Conventions:
// - Prefer GROUP BY + aggregations when user asks for totals by month/year/customer.
// - Use BETWEEN with inclusive bounds or date_trunc for month ranges.
// - If ambiguous, choose **reasonable default**:
//   - "ยอดขายเดือน X" → sum "grandTotal" from "Bill" filtered by "deliveryDate" within that calendar month.
// - Always alias results with safe snake_case (quoted), e.g. "total_sales".
// `;
const SCHEMA_CONTEXT = `
You are an NL2SQL generator for PostgreSQL. Use ONLY these tables and columns.
- Use **double quotes** for every identifier (tables, columns, aliases) because schema uses camelCase.
- Output ONLY ONE SQL statement, **no code fences**, no explanation.
- Return **read-only SELECT** (or WITH ... SELECT). Absolutely no DDL/DML.

Tables (columns):
${Object.entries(ALLOWED)
  .map(([t, cols]) => `- "${t}" (${cols.map((c) => `"${c}"`).join(", ")})`)
  .join("\n")}

Business hints:
- "ยอดขาย" = usually sum of "grandTotal" from "Bill" or sum of "total" from "OrderPO" depending on user wording.
- Dates:
  - Use "date" (OrderPO), "deliveryDate" (Bill), "createdAt" (Bill/Expense/SteelType), "expenseDate" (Expense)
  - For month filters in Thai (เช่น "มกราคม" = January) map to month number; use date_trunc or EXTRACT(MONTH FROM ...).
- Relationships:
  - "Bill"."customerId" -> "Customer"."id"
  - "OrderPO"."customerId" -> "Customer"."id"
  - "OrderPO"."billId" -> "Bill"."id"
  - "Product"."orderPOId" -> "OrderPO"."id"
  - "Product"."steelId" -> "SteelType"."id"
  - "StaffIncome"."typeId" -> "TypeStaffIncome"."id"
  - "Expense"."categoryId" -> "ExpenseCategory"."id"
  - "Staff"."userId" -> "User"."id"

Conventions:
- Prefer GROUP BY + aggregations when user asks for totals by month/year/customer.
- Use BETWEEN with inclusive bounds or date_trunc for month ranges.
- If ambiguous, choose **reasonable default**:
  - "ยอดขายเดือน X" → sum "grandTotal" from "Bill" filtered by "deliveryDate" within that calendar month.
- Always alias results with safe snake_case (quoted), e.g. "total_sales".

String search rules (very important):
- When the user asks to find data by **name**, **company name**, **staff name**, **customer name**, **product detail**, **invoice**, **PO number**, **bank name**, **description**, or any text field that could be incomplete,
  you must use **ILIKE** with wildcards on both sides:  
  e.g. \`"Customer"."name" ILIKE '%' || <keyword> || '%'\`
- Apply this rule to **every table** that contains textual fields (such as "name", "detail", "description", "code", "bankName", "address", "email", "tel", etc).
- Always use ILIKE instead of = when comparing text fields that are likely partial or uncertain.
- Only use = for exact identifiers like numeric IDs, unique codes, or foreign keys.
- If the user inputs a Buddhist year (ปี พ.ศ.), convert it to Christian year (ปี ค.ศ.) by subtracting 543.
- If the user says the customer name directly → use "=".
- If the user says “มีคำว่า”, “contains”, “ประมาณว่า”, or types partial text → use ILIKE '%keyword%'.
- For date filters:
  - If user asks for a single day → use o."date"::date = DATE 'YYYY-MM-DD'.
  - If user asks for a date range → use:
      o."date" >= 'YYYY-MM-DD 00:00:00'
      AND o."date" <  'YYYY-MM-DD+1 00:00:00'
  - If user includes time range → merge date + time:
      o."date" >= 'YYYY-MM-DD HH:MM:00'
      AND o."date" <= 'YYYY-MM-DD HH:MM:59'
- If user mentions PO number → search with ILIKE unless the user explicitly says “เท่ากับ”.

Examples:
- If the user says "หาลูกค้าชื่อ กรุงเทพ", generate  
  \`SELECT * FROM "Customer" WHERE "name" ILIKE '%กรุงเทพ%'\`
- If the user says "หาพนักงานชื่อ เมย์", generate  
  \`SELECT * FROM "Staff" WHERE "name" ILIKE '%เมย์%'\`
- If the user says "หาสินค้ารายละเอียด เหล็ก", generate  
  \`SELECT * FROM "Product" WHERE "detail" ILIKE '%เหล็ก%'\`
- If the user says "หาธนาคาร กสิกร", generate  
  \`SELECT * FROM "Staff" WHERE "bankName" ILIKE '%กสิกร%'\`
- If the user says "หาหมวดค่าใช้จ่ายเดินทาง", generate  
  \`SELECT * FROM "ExpenseCategory" WHERE "name" ILIKE '%เดินทาง%'\`
- If the user says "หาใบแจ้งหนี้ เลข 123", generate  
  \`SELECT * FROM "Bill" WHERE "invoiceNo" ILIKE '%123%'\`
- If the user says "หาลูกค้าอีเมล example", generate  
  \`SELECT * FROM "Customer" WHERE "email" ILIKE '%example%'\`
- If the user says "หาพนักงานจากรหัสพนักงาน S001", generate
  \`SELECT "User".* FROM "Staff" JOIN "User" ON "Staff"."userId" = "User"."id" WHERE "Staff"."code" = 'S001'\`
- If the user says "หาพนักงานตำแหน่ง หัวหน้า", generate
  \`SELECT "User".* FROM "Staff" JOIN "User" ON "Staff"."userId" = "User"."id" WHERE "Staff"."position" ILIKE '%หัวหน้า%'\`
- If the user says "หาพนักงานจากเลขบัญชี 1234567890", generate
  \`SELECT "User".* FROM "Staff" JOIN "User" ON "Staff"."userId" = "User"."id" WHERE "Staff"."bankAccount" = '1234567890'\`
- If the user says "หาพนักงานธนาคาร กสิกร", generate
  \`SELECT "User".* FROM "Staff" JOIN "User" ON "Staff"."userId" = "User"."id" WHERE "Staff"."bankName" ILIKE '%กสิกร%'\`
- If the user says "หาพนักงานจากเลขประกันสังคม 9999999", generate
  \`SELECT "User".* FROM "Staff" JOIN "User" ON "Staff"."userId" = "User"."id" WHERE "Staff"."social_security" = '9999999'\`
- If the user says "หาพนักงานเงินเดือนมากกว่า 20000", generate
  \`SELECT "User".* FROM "Staff" JOIN "User" ON "Staff"."userId" = "User"."id" WHERE "Staff"."currentSalary" >= 20000\`
- If the user says "หาพนักงานเริ่มงานปี 2024", generate
  \`SELECT "User".* FROM "Staff" JOIN "User" ON "Staff"."userId" = "User"."id" WHERE "Staff"."startDate" >= '2024-01-01'\`
- If the user says "หาใบ Order PO เลข 456", generate
  \`SELECT * FROM "OrderPO" WHERE "poNumber" ILIKE '%456%'\`
- If the user says "หาใบ Order PO วันที่ 26 พฤศจิกายน 2026", generate
  \`SELECT * FROM "OrderPO" WHERE "date"::date = DATE '2025-11-26'\`
- If the user says "หาใบ Order PO ของลูกค้า กรุงเทพ", generate
  \`SELECT 
  o.id,
  o."poNumber",
  o."date",
  o.status,
  o.total,
  c.id        AS "customerId",
  c.code      AS "customerCode",
  c.name      AS "customerName"
FROM "OrderPO" o
JOIN "Customer" c
  ON c.id = o."customerId"
WHERE c.name = 'หจก. สมบูรณ์สตีล' LIMIT 100'\`
 - If the user says "หาใบ Order PO ของลูกค้าที่มีคำว่า บริษัท เอเชีย เมทัล โปรดักส์" และ วันที่ 26 พฤศจิกายน 2025, generate
 \`SELECT 
  o.id,
  o."poNumber",
  o."date",
  o.status,
  o.total,
  c.id        AS "customerId",
  c.code      AS "customerCode",
  c.name      AS "customerName"
FROM "OrderPO" o
JOIN "Customer" c
  ON c.id = o."customerId"
WHERE c.name = 'บริษัท เอเชีย เมทัล โปรดักส์'
  AND o."date"::date = DATE '2025-11-26' LIMIT 100\`

General behavior:
- Always return a valid PostgreSQL SELECT or WITH ... SELECT statement.
- Prefer joins only when the query explicitly mentions relationships (e.g. customer name with bill total).
- When in doubt between equality and partial match, prefer **ILIKE with wildcards**.
- Never output explanations, Markdown fences, or extra text—only pure SQL.
- Always convert พ.ศ. to ค.ศ. when needed.
`;

export async function GETSQL(sql: string) {
  console.log("Executing SQL from chatbot:", sql);
  const encodedSQL = encodeURIComponent(sql);
  const resp = await fetch(
    `${process.env.NEXTAUTH_URL}api/chatbot?sql=${encodedSQL}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
    }
  );

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`chatbot error ${resp.status}: ${errText}`);
  }
  return resp.json();
}
// ---------- 4) OPENROUTER CALL ----------
async function callOpenRouter(userQuery: string): Promise<string> {
  const messages = [
    { role: "system" as const, content: SCHEMA_CONTEXT },
    {
      role: "user" as const,
      content:
        `จงเขียนคำสั่ง SQL (PostgreSQL) เพียง 1 คำสั่ง สำหรับคำขอนี้ โดยทำตามกฎทั้งหมดด้านบน:\n` +
        `คำขอ: ${userQuery}\n\n` +
        `รูปแบบผลลัพธ์: ส่งเฉพาะคำสั่ง SQL เดียว ไม่มีคำอธิบาย ไม่มี backticks ไม่มีเครื่องหมาย \`\`\`.`,
    },
  ];

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      // ป้องกันโมเดลพล่าม
      temperature: 0.1,
      max_tokens: 800,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenRouter error: ${resp.status} ${text}`);
  }
  const data = await resp.json();
  const sql: string = data?.choices?.[0]?.message?.content?.trim?.() || "";

  if (!sql) throw new Error("Empty SQL from model");

  // ตัด code fences เผื่อโมเดลเผลอแถมมา
  return sql
    .replace(/^```sql\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

// ---------- 5) HANDLER ----------
export async function POST(req: NextRequest) {
  const session = await getServerSession({ req, ...authOptions });
  // Fix: Only allow if role is superadmin OR supervisor
  console.log("Session:", session);
  if (
    !session ||
    !["superadmin", "supervisor", "clerk"].includes(session.user?.role)
  ) {
    return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
  }
  try {
    const body = await req.json();
    const userQuery: string = (body?.query || "").toString().trim();

    if (!userQuery) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    // 1) ขอ SQL จาก OpenRouter
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

    // กรณีไม่มี urlPo → ค่อย narrate ตามปกติ
    const narration = await narrateArrayWithOpenRouter(
      Array.isArray(response) ? response : [response]
    );

    return NextResponse.json({
      sql: rawSql,
      result: narration,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}
