// helpers สำหรับ chatbot NL2SQL (ย้ายมาจาก route.ts)
//import { NextResponse } from "next/server";

// ---------- CONFIG ----------
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat-v3-0324";
const INTERNAL_SECRET = process.env.INTERNAL_SQL_API_SECRET!;

// ---------- CONTEXT PREPROCESSING ----------
function preprocessQuery(query: string): { query: string; context: string } {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisMonth = today.getMonth() + 1;
  const thisYear = today.getFullYear();

  const todayStr = today.toISOString().split("T")[0];
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const context = `
วันนี้: ${todayStr}
เมื่อวาน: ${yesterdayStr}
เดือนนี้: ${thisMonth}
ปีนี้ (ค.ศ.): ${thisYear}
ปีนี้ (พ.ศ.): ${thisYear + 543}
`;

  // แปลงคำพูดเป็นวันที่จริง
  let processed = query
    .replace(/วันนี้/gi, todayStr)
    .replace(/เมื่อวาน/gi, yesterdayStr)
    .replace(/เดือนนี้/gi, `เดือน ${thisMonth}`)
    .replace(/ปีนี้/gi, `ปี ${thisYear}`);

  // แปลงปีพุทธศักราช (พ.ศ.) เป็นคริสต์ศักราช (ค.ศ.)
  // จับรูปแบบ: "ปี 2569", "ปี2569", "พ.ศ. 2569", "พ.ศ.2569", "2569"
  processed = processed.replace(
    /(?:ปี\s*|พ\.ศ\.\s*)?(25\d{2})/gi,
    (match, year) => {
      const buddhistYear = parseInt(year);
      if (buddhistYear >= 2500 && buddhistYear <= 2600) {
        const christianYear = buddhistYear - 543;
        return `ปี ${christianYear}`;
      }
      return match;
    },
  );

  return { query: processed, context };
}

// ---------- RAG KNOWLEDGE BASE ----------
interface KnowledgeItem {
  pattern: RegExp;
  tables: string[];
  examples: string[];
}

const KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    pattern: /ยอดขาย|รายได้|ขายได้|ขายออเดอร์|ยอดรวม|รวมยอด|ซื้อเยอะ|ซื้อมาก/i,
    tables: ["Bill", "Customer", "OrderPO"],
    examples: [
      `SELECT SUM("grandTotal") as "total_sales" FROM "Bill" WHERE "deliveryDate" = '2024-01-15'`,
      `SELECT SUM("grandTotal") as "total_sales" FROM "Bill" WHERE "deliveryDate" >= '2024-01-01' AND "deliveryDate" < '2024-02-01'`,
      `SELECT SUM("grandTotal") as "total_sales" FROM "Bill" WHERE EXTRACT(YEAR FROM "dateReceive") = 2026`,
      `SELECT c."name", SUM(b."grandTotal") as "total_sales" FROM "Customer" c JOIN "Bill" b ON c."id" = b."customerId" WHERE EXTRACT(YEAR FROM b."dateReceive") = 2026 GROUP BY c."name" ORDER BY "total_sales" DESC LIMIT 1`,
      `SELECT c."name", SUM(b."grandTotal") as "total" FROM "Customer" c JOIN "Bill" b ON c."id" = b."customerId" GROUP BY c."name" ORDER BY "total" DESC`,
    ],
  },
  {
    pattern: /ลูกค้า|เจ้าไหน|บริษัท|คัสเตอเมอร์|ซื้อเยอะ|ซื้อมาก/i,
    tables: ["Customer", "Bill"],
    examples: [
      `SELECT * FROM "Customer" WHERE "name" ILIKE '%ธนาวรรณ%'`,
      `SELECT c."name", c."tel", c."address" FROM "Customer" c WHERE c."code" ILIKE '%C001%'`,
      `SELECT c."name", SUM(b."grandTotal") as "total_sales" FROM "Customer" c JOIN "Bill" b ON c."id" = b."customerId" GROUP BY c."name" ORDER BY "total_sales" DESC LIMIT 10`,
      `SELECT c."name", SUM(b."grandTotal") as "total_sales" FROM "Customer" c JOIN "Bill" b ON c."id" = b."customerId" WHERE EXTRACT(YEAR FROM b."dateReceive") = 2026 GROUP BY c."name" ORDER BY "total_sales" DESC LIMIT 1`,
    ],
  },
  {
    pattern: /พนักงาน|สตาฟ|เงินเดือน|รายได้อื่น/i,
    tables: ["Staff", "User", "StaffIncome", "StaffSalary"],
    examples: [
      `SELECT u."name", s."position", s."currentSalary" FROM "Staff" s JOIN "User" u ON s."userId" = u."id"`,
      `SELECT u."name", SUM(si."amount") as "total_income" FROM "Staff" s JOIN "User" u ON s."userId" = u."id" JOIN "StaffIncome" si ON s."id" = si."staffId" GROUP BY u."name"`,
    ],
  },
  {
    pattern: /ออเดอร์|PO|ใบสั่ง/i,
    tables: ["OrderPO", "Customer", "Product"],
    examples: [
      `SELECT * FROM "OrderPO" WHERE "poNumber" ILIKE '%PO001%'`,
      `SELECT o."poNumber", c."name", o."total" FROM "OrderPO" o JOIN "Customer" c ON o."customerId" = c."id" WHERE o."date" = '2024-01-15'`,
      `SELECT COUNT(*) as "order_count" FROM "OrderPO" WHERE "status" = 'completed'`,
    ],
  },
  {
    pattern: /ค่าใช้จ่าย|ค่าโดยสาร|เบิก/i,
    tables: ["Expense", "ExpenseCategory"],
    examples: [
      `SELECT SUM("amount") as "total_expense" FROM "Expense" WHERE "expenseDate" >= '2024-01-01' AND "expenseDate" < '2024-02-01'`,
      `SELECT ec."name", SUM(e."amount") as "total" FROM "Expense" e JOIN "ExpenseCategory" ec ON e."categoryId" = ec."id" GROUP BY ec."name"`,
    ],
  },
];

function getRelevantContext(query: string): string {
  const relevant = KNOWLEDGE_BASE.find((kb) => kb.pattern.test(query));

  if (!relevant) {
    // Fallback: ส่ง minimal schema
    return `Tables: Bill, Customer, OrderPO, Staff, Product
Use ILIKE for text search, JOIN when needed, GROUP BY for totals.`;
  }

  const tableSchemas = relevant.tables
    .map((t) => `"${t}" (${ALLOWED[t]?.map((c) => `"${c}"`).join(", ") || ""})`)
    .join("\n");

  return `
Relevant tables:
${tableSchemas}

Example queries:
${relevant.examples.join("\n\n")}
`;
}

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

// ---------- SIMPLIFIED SCHEMA CONTEXT ----------
const BASE_SCHEMA_RULES = `
You are an NL2SQL generator for PostgreSQL.
- Use **double quotes** for every identifier (tables, columns, aliases).
- Output ONLY ONE SQL statement, **no code fences**, no explanation.
- Return **read-only SELECT** only. No DDL/DML.
- **DO NOT include semicolon (;) at the end.**

Key relationships:
- "Bill"."customerId" -> "Customer"."id"
- "OrderPO"."customerId" -> "Customer"."id"
- "Staff"."userId" -> "User"."id"
- "Product"."orderPOId" -> "OrderPO"."id"

Rules:
- Use ILIKE '%text%' for partial text search (names, codes, descriptions)
- Use = only for exact IDs or numbers
- For dates: Use ISO format 'YYYY-MM-DD'
- For years in database: ALL dates are stored in Christian era (ค.ศ./AD), NOT Buddhist era (พ.ศ./BE)
- Year conversion: Buddhist year (พ.ศ.) = Christian year (ค.ศ.) + 543
  Example: พ.ศ. 2569 = ค.ศ. 2026, พ.ศ. 2568 = ค.ศ. 2025
- For year filters: EXTRACT(YEAR FROM "dateColumn") = YYYY (use Christian year)
- For month filters: EXTRACT(MONTH FROM "date") = N
- For aggregations: Always use GROUP BY with aggregate functions
- For "top N": USE ORDER BY ... DESC LIMIT N
- Alias results clearly: "total_sales", "customer_name", etc.
`;

export async function narrateArrayWithOpenRouter(
  dataArray: unknown[],
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
    console.error(`[OpenRouter Narration] API error ${resp.status}:`, text);
    throw new Error(`ไม่สามารถเรียบเรียงข้อมูลได้ (${resp.status})`);
  }

  const data = await resp.json();
  const text: string = data?.choices?.[0]?.message?.content?.trim?.() ?? "";
  if (!text) {
    console.error("[OpenRouter Narration] Empty response");
    throw new Error("AI model ไม่สามารถเรียบเรียงข้อมูลได้");
  }
  return text;
}

export async function GETSQL(sql: string) {
  console.log("Executing SQL from chatbot (via internal proxy):", sql);
  const encodedSQL = encodeURIComponent(sql);

  // ใช้ absolute URL สำหรับ server-side fetch
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/chatbot?sql=${encodedSQL}`;
  console.log("Calling internal API:", url);

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": INTERNAL_SECRET,
    },
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    console.error("GETSQL error:", resp.status, errText);
    throw new Error(`ไม่สามารถรันคำสั่ง SQL ได้ (${resp.status}): ${errText}`);
  }
  return resp.json();
}

export async function callOpenRouter(userQuery: string): Promise<string> {
  // Step 1: Preprocess query (แปลงวันที่)
  const { query: processedQuery, context } = preprocessQuery(userQuery);
  console.log("[Chatbot] Preprocessed query:", processedQuery);

  // Step 2: Get relevant context (RAG)
  const relevantContext = getRelevantContext(processedQuery);

  // Step 3: Build optimized prompt
  const systemPrompt = `${BASE_SCHEMA_RULES}

${relevantContext}

Current date context:
${context}

Instructions:
- Generate ONLY the SQL statement
- No explanations, no markdown, no semicolon
- Use the examples above as reference for query patterns
`;

  const messages = [
    { role: "system" as const, content: systemPrompt },
    {
      role: "user" as const,
      content: `Generate SQL for: ${processedQuery}`,
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
      max_tokens: 500,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error(`[OpenRouter] API error ${resp.status}:`, text);
    throw new Error(
      `ไม่สามารถเชื่อมต่อกับ AI model ได้ (${resp.status}). กรุณาตรวจสอบ OPENROUTER_MODEL ใน .env ว่าถูกต้อง`,
    );
  }
  const data = await resp.json();
  let sql: string = data?.choices?.[0]?.message?.content?.trim?.() || "";

  if (!sql) {
    console.error("[OpenRouter] Empty response from model");
    throw new Error("AI model ไม่สามารถสร้าง SQL ได้");
  }

  // ลบ code fences และ semicolon
  sql = sql
    .replace(/^```sql\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .replace(/;\s*$/g, "")
    .trim();

  console.log("[Chatbot] Final SQL:", sql);
  return sql;
}
