// helpers สำหรับ chatbot NL2SQL (ย้ายมาจาก route.ts)
//import { NextResponse } from "next/server";

// ---------- CONFIG ----------
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
- Prefer GROUP BY  aggregations when user asks for totals by month/year/customer.
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
      AND o."date" <  'YYYY-MM-DD1 00:00:00'
  - If user includes time range → merge date  time:
      o."date" >= 'YYYY-MM-DD HH:MM:00'
      AND o."date" <= 'YYYY-MM-DD HH:MM:59'
- If user mentions PO number → search with ILIKE unless the user explicitly says “เท่ากับ”.

General behavior:
- Always return a valid PostgreSQL SELECT or WITH ... SELECT statement.
- Prefer joins only when the query explicitly mentions relationships (e.g. customer name with bill total).
- When in doubt between equality and partial match, prefer **ILIKE with wildcards**.
- Never output explanations, Markdown fences, or extra text—only pure SQL.
- Always convert พ.ศ. to ค.ศ. when needed.
`;

export async function narrateArrayWithOpenRouter(
  dataArray: unknown[]
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    throw new Error("Invalid or empty data array");
  }

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

export async function GETSQL(sql: string) {
  console.log("Executing SQL from chatbot (via internal proxy):", sql);
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

export async function callOpenRouter(userQuery: string): Promise<string> {
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

  return sql
    .replace(/^```sql\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}
