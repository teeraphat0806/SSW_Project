import { randomBytes } from "crypto";


function  generateCode(
  length = 20,
  charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()-_=+[]{};:,.?/\\|~"
) {
  if (length <= 0) return "";
  const chars = charset;
  const n = chars.length;
  if (n < 2) throw new Error("charset ต้องมีอักขระอย่างน้อย 2 ตัว");

  const bytes: Uint8Array = randomBytes(length * 2); // กันเผื่อทิ้งบาง byte
  const result: string[] = [];
  const max = 256 - (256 % n); // ใช้เฉพาะค่า < max เพื่อลด modulo bias

  let i = 0;
  while (result.length < length) {
    if (i >= bytes.length) {
      // ไม่พอ ก็ขอเพิ่ม
      const more = randomBytes(length);
      const tmp = new Uint8Array(more);
      for (let j = 0; j < tmp.length; j++) bytes[i + j] = tmp[j];
    }
    const rnd = bytes[i++]!;
    if (rnd < max) {
      result.push(chars[rnd % n]!);
    }
  }
  return result.join("");
}


export const billData = [
  {
    Customer: { connect: { id: 1 } },
    yourRef: "REF100",
    invoiceNo: "INV100",
    codeCustomer: generateCode(),
    credit: new Date("2025-08-31"),
    deliveryDate: new Date("2025-10-28"),
    deliveryOrderNo: "DO100",
    salesName: "สมชาย ใจดี",
    deliveredBy: "กานต์พิชชา ส่งไว",
    Staff_Bill_salesNameToStaff: { connect: { id: 1 } },
    Staff_Bill_deliveredByToStaff: { connect: { id: 5 } },
    description: "กรดไหลย้อนคำสั่งวิ่งพนมมือกล่าวคลานผู้ร้าย",
    subtotal: 1000,
    discount: 7.74,
    vat: 70.0,           
    grandTotal: 1062.26, 
    dateReceive: new Date("2025-08-01"),
    typeBill: "บิลเงินสด",

    OrderPO: {
      create: [
        {
          poNumber: "PO-001",
          total: 1000,
          
          urlPo: ["po1.pdf"],
          date: new Date(),
          Product: {
            create: [
              {
                SteelType: { connect: { codeSteel: "SS400" } },
                wide: 10,
                length: 20,
                thickness: 1,
                amount: 5,
                total: 200,
              },
              {
                SteelType: { connect: { codeSteel: "A36" } },
                wide: 15,
                length: 25,
                thickness: 2,
                amount: 10,
                total: 800,
              },
            ],
          },
        },
      ],
    },
  },
  {
    Customer: { connect: { id: 2 } },
    yourRef: "REF101",
    invoiceNo: "INV101",
    codeCustomer: generateCode(),
    credit: new Date("2025-08-31"),
    deliveryDate: new Date("2025-10-28"),
    deliveryOrderNo: "DO101",
    salesName: "สมชาย ใจดี",
    deliveredBy: "กานต์พิชชา ส่งไว",
    Staff_Bill_salesNameToStaff: { connect: { id: 1 } },
    Staff_Bill_deliveredByToStaff: { connect: { id: 5 } },
    description: "ระเบียงมัสยิดเคย ",
    subtotal: 1000,
    discount: 7.74,
    vat: 70.0,           
    grandTotal: 1062.26, 
    dateReceive: new Date("2025-08-01"),
    typeBill: "บิลเครดิต",
    OrderPO: {
      create: [
        {
          poNumber: "PO-002",
          total: 2000,
          
          urlPo: ["po2.pdf"],
          date: new Date(),
          Product: {
            create: [
              {
                SteelType: { connect: { codeSteel: "A572" } },
                wide: 10,
                length: 20,
                thickness: 1,
                amount: 5,
                total: 200,
              },
              {
                SteelType: { connect: { codeSteel: "A516" } },
                wide: 15,
                length: 25,
                thickness: 2,
                amount: 10,
                total: 800,
              },
            ],
          },
        },
      ],
    },
  },
  {
    Customer: { connect: { id: 3 } },
    yourRef: "REF102",
    invoiceNo: "INV102",
    codeCustomer: generateCode(),
    credit: new Date("2025-08-31"),
    deliveryDate: new Date("2025-10-28"),
    deliveryOrderNo: "DO102",
    salesName: "สมชาย ใจดี",
    deliveredBy: "กานต์พิชชา ส่งไว",
    Staff_Bill_salesNameToStaff: { connect: { id: 1 } },
    Staff_Bill_deliveredByToStaff: { connect: { id: 5 } },
    description: "โตยตอกไหนอัศจรรย์ ",
    subtotal: 1000,
    discount: 7.74,
    vat: 70.0,           
    grandTotal: 1062.26, 
    dateReceive: new Date("2025-08-01"),
    typeBill: "บิลเครดิต",
    OrderPO: {
      create: [
        {
          poNumber: "PO-003",
          total: 3000,
          
          urlPo: ["po3.pdf"],
          date: new Date(),
          Product: {
            create: [
              {
                SteelType: { connect: { codeSteel: "AISI 1018" } },
                wide: 10,
                length: 20,
                thickness: 1,
                amount: 5,
                total: 200,
              },
              {
                SteelType: { connect: { codeSteel: "SUS304" } },
                wide: 15,
                length: 25,
                thickness: 2,
                amount: 10,
                total: 800,
              },
            ],
          },
        },
      ],
    },
  },
  {
    Customer: { connect: { id: 4 } },
    yourRef: "REF103",
    invoiceNo: "INV103",
    codeCustomer: generateCode(),
    credit: new Date("2025-08-31"),
    deliveryDate: new Date("2025-10-28"),
    deliveryOrderNo: "DO103",
    salesName: "สมชาย ใจดี",
    deliveredBy: "กานต์พิชชา ส่งไว",
    Staff_Bill_salesNameToStaff: { connect: { id: 1 } },
    Staff_Bill_deliveredByToStaff: { connect: { id: 5 } },
    description: "ทุกข์เกาหลีขนมชั้นพิการเนื่องจากสมาคมแตะ ",
    subtotal: 1000,
    discount: 7.74,
    vat: 70.0,           
    grandTotal: 1062.26, 
    dateReceive: new Date("2025-08-01"),
    typeBill: "บิลเงินสด",
    OrderPO: {
      create: [
        {
          poNumber: "PO-004",
          total: 4000,
          
          urlPo: ["po4.pdf"],
          date: new Date(),
          Product: {
            create: [
              {
                SteelType: { connect: { codeSteel: "SS400" } },
                wide: 10,
                length: 20,
                thickness: 1,
                amount: 5,
                total: 200,
              },
              {
                SteelType: { connect: { codeSteel: "SUS304" } },
                wide: 15,
                length: 25,
                thickness: 2,
                amount: 10,
                total: 800,
              },
            ],
          },
        },
      ],
    },
  },
  {
    Customer: { connect: { id: 5 } },
    yourRef: "REF104",
    invoiceNo: "INV104",
    codeCustomer: generateCode(),
    credit: new Date("2025-08-31"),
    deliveryDate: new Date("2025-10-28"),
    deliveryOrderNo: "DO104",
    salesName: "สมชาย ใจดี",
    deliveredBy: "กานต์พิชชา ส่งไว",
    Staff_Bill_salesNameToStaff: { connect: { id: 1 } },
    Staff_Bill_deliveredByToStaff: { connect: { id: 5 } },
    description: "วัฒนธรรมใหม่ขันน้ำองค์คะแนนทดหอย ",
    subtotal: 1000,
    discount: 7.74,
    vat: 70.0,           
    grandTotal: 1062.26, 
    dateReceive: new Date("2025-08-01"),
    typeBill: "บิลเงินสด",
    OrderPO: {
      create: [
        {
          poNumber: "PO-005",
          total: 5000,
          
          urlPo: ["po5.pdf"],
          date: new Date(),
          Product: {
            create: [
              {
                SteelType: { connect: { codeSteel: "SS400" } },
                wide: 10,
                length: 20,
                thickness: 1,
                amount: 5,
                total: 200,
              },
              {
                SteelType: { connect: { codeSteel: "A36" } },
                wide: 15,
                length: 25,
                thickness: 2,
                amount: 10,
                total: 800,
              },
            ],
          },
        },
      ],
    },
  },
];
