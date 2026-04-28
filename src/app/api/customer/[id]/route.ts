import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";

import prisma from "../../../../lib/prisma";
import { CustomerSchema } from "../../../../lib/schemas/customer.schema";
import { digitsOnly } from "@/lib/calculateGrandTotal";
// GET /api/customer/[id]
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authResult = await requireAuth(["superadmin", "clerk", "supervisor"]);

  if ("response" in authResult) {
    return authResult.response;
  }
  const { session } = authResult;
  console.log(session);
  try {
    const result = await prisma.customer.findUnique({
      where: { id: Number(id) },
      include: {
        contacts: true,
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch customer: " + error },
      { status: 500 },
    );
  }
}

// PATCH /api/customer/[id]
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authResult = await requireAuth(["superadmin", "clerk", "supervisor"]);

  if ("response" in authResult) {
    return authResult.response;
  }

  const body = await req.json();
  const parsed = CustomerSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: Number(id) },
    });
    if (!customer) {
      return NextResponse.json(
        { error: "ไม่พบลูกค้าที่ระบุ" },
        { status: 404 },
      );
    }

    // Never allow client to update immutable/identity fields like `id`
    const { id: _ignoredId, contacts, deletedContactIds, ...customerData } =
      parsed.data;

    //ให้ค่าเริ่มต้นเป็นค่าเดิมก่อน เพื่อให้ถ้าไม่ได้ส่งมา จะได้ไม่ถูกลบออกไป
    let telSearch = customer.telSearch;
    let faxNumberSearch = customer.faxNumberSearch;

    // ถ้าส่งค่าใหม่มา ให้ปรับค่า telSearch และ faxNumberSearch ตามค่าใหม่
    if (customerData.tel !== undefined) {
      telSearch = customerData.tel ? digitsOnly(customerData.tel) : null;
    }
    if (customerData.faxNumber !== undefined) {
      faxNumberSearch = customerData.faxNumber
        ? digitsOnly(customerData.faxNumber)
        : null;
    }

    // ตรวจสอบ contacts ที่เป็น primary เพื่อ override ค่า telSearch, faxNumberSearch, emailSearch ตามประเภทของ contact
    const primaryOverrides: {
      tel?: string | null;
      faxNumber?: string | null;
      email?: string | null;
      address?: string;
    } = {};

    if (contacts?.length) {
      for (const contact of contacts) {
        if (!contact.isPrimary) continue;
        if (contact.type === "PHONE") {
          primaryOverrides.tel = contact.value;
          telSearch = digitsOnly(contact.value);
        } else if (contact.type === "FAX") {
          primaryOverrides.faxNumber = contact.value;
          faxNumberSearch = digitsOnly(contact.value);
        } else if (contact.type === "EMAIL") {
          primaryOverrides.email = contact.value;
        } else if (contact.type === "ADDRESS") {
          primaryOverrides.address = contact.value;
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // ลบ contacts ที่ mark ไว้
      if (deletedContactIds?.length) {
        const toDelete = await tx.customerContact.findMany({
          where: { id: { in: deletedContactIds }, customerId: Number(id) },
        });

        // ถ้า primary ถูกลบ → null ค่าใน customer ด้วย
        for (const c of toDelete) {
          if (!c.isPrimary) continue;
          if (c.type === "PHONE") {
            primaryOverrides.tel = null;
            telSearch = null;
          } else if (c.type === "FAX") {
            primaryOverrides.faxNumber = null;
            faxNumberSearch = null;
          } else if (c.type === "EMAIL") {
            primaryOverrides.email = null;
          }
          // ADDRESS ไม่แตะ เพราะลบไม่ได้
        }

        await tx.customerContact.deleteMany({
          where: { id: { in: deletedContactIds }, customerId: Number(id) },
        });
      }

      if (contacts?.length) {
        for (const contact of contacts) {
          if (contact.id) {
            await tx.customerContact.update({
              where: { id: contact.id },
              data: {
                type: contact.type,
                value: contact.value,
                label: contact.label ?? null,
                isPrimary: contact.isPrimary ?? false,
              },
            });
          } else {
            await tx.customerContact.create({
              data: {
                customerId: Number(id),
                type: contact.type,
                value: contact.value,
                label: contact.label ?? null,
                isPrimary: contact.isPrimary ?? false,
              },
            });
          }
        }
      }

      return await tx.customer.update({
        where: { id: Number(id) },
        data: {
          ...customerData,
          ...primaryOverrides,
          telSearch,
          faxNumberSearch,
        },
        include: { contacts: true },
      });
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update customer: " + error },
      { status: 500 },
    );
  }
}

// DELETE /api/customer/[id]
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authResult = await requireAuth(["superadmin", "clerk"]);

  if ("response" in authResult) {
    return authResult.response;
  }
  const { session } = authResult;
  console.log(session);

  const customerId = Number(id);
  if (!Number.isFinite(customerId)) {
    return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,

        _count: { select: { Bill: true, OrderPO: true } },
      },
    });
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    if (customer._count.Bill > 0 || customer._count.OrderPO > 0) {
      return NextResponse.json(
        { error: "Cannot delete customer with existing bills or orders" },
        { status: 400 },
      );
    }
    await prisma.customer.delete({
      where: { id: customerId },
    });
    return NextResponse.json({ message: `Delete Complete` }, { status: 200 });
  } catch (error) {
    console.error("error: ", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 },
    );
  }
}
