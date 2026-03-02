// src/app/api/job-order-detail/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { CuttingMethod, ShapeSteel, status } from "@/types";
import { Session } from "inspector/promises";

type ApiStaffMember = {
  id: number;
  name: string;
  role: "supervisor" | "cutter";
};

type ApiDeliveryMember = {
  id: number | null;
  name: string;
  role: "delivery";
};

type ApiJobOrder = {
  id: number;
  billid: number;
  poNumber: string | null;
  codetoinvoice: number;
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  deliveryAddress: string;
  key: string[];
  supervisors: ApiStaffMember[];
  technicians: ApiStaffMember[];
  deliveryStaff: ApiDeliveryMember | null;
  vatRate: number;
  steel: {
    steelType: string;
    amount: number;
    width?: number;
    length?: number;
    thickness?: number;
    price: number;
    weight: number | null;
    density: number;
    detail?: string;
    shape: ShapeSteel;
    job?: string;
    cuttingMethod: CuttingMethod;
    isOD: boolean;
    isServices: boolean;
    isPerAmount: boolean;
    discount?: number | null;
  }[];
  updatedAt: Date;
  status: status;
  createdAt: Date;
  deliveryDate: Date;
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth(["superadmin", "clerk", "supervisor"]);
  if ("response" in authResult) return authResult.response;

  const { id } = await context.params;
  const poId = Number(id);

  if (Number.isNaN(poId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const jobOrder = await prisma.orderPO.findUnique({
      where: { id: poId },
      include: {
        bill: {
          select: {
            id: true,
            deliveryDate: true,
            vatRate: true,
            deliveredBy: true,
            deliveredById: true,
            Staff_Bill_deliveredByToStaff: {
              select: {
                id: true,
                user: { select: { name: true } },
                code: true,
              },
            },
          },
        },
        Product: {
          orderBy: [{ sequence: "asc" }],
          include: {
            SteelType: true,
          },
        },
        Customer: {
          select: {
            id: true,
            name: true,
            email: true,
            tel: true,
            address: true,
          },
        },
        staffLinks: {
          include: { staff: { include: { user: true } } },
        },
      },
    });

    if (!jobOrder) {
      return NextResponse.json(
        { error: "Job order not found" },
        { status: 404 },
      );
    }

    // 🔴 ถ้าไม่มี Customer หรือ Bill ถือว่าข้อมูล order เสีย / ไม่สมบูรณ์
    if (!jobOrder.Customer || !jobOrder.bill) {
      return NextResponse.json(
        { error: "Order is missing Customer or Bill relation" },
        { status: 500 },
      );
    }
    const links = jobOrder.staffLinks ?? [];

    const allStaff: ApiStaffMember[] = links.map((x) => ({
      id: x.staff.id,
      name: x.staff.user?.name ?? x.staff.code,
      role: x.role, // ✅ role ในงาน (SUPERVISOR/CUTTER)
    }));

    const supervisors = allStaff.filter((s) => s.role === "supervisor");
    const technicians = allStaff.filter((s) => s.role === "cutter");
    const customer = jobOrder.Customer;
    const bill = jobOrder.bill;
    const deliveryStaff: ApiDeliveryMember | null =
      bill.deliveredById != null || bill.deliveredBy
        ? {
            id: bill.deliveredById ?? null,
            name:
              bill.Staff_Bill_deliveredByToStaff?.user?.name ??
              bill.Staff_Bill_deliveredByToStaff?.code ??
              bill.deliveredBy ??
              "Unknown",
            role: "delivery",
          }
        : null;

    const apiJobOrder: ApiJobOrder = {
      id: jobOrder.id,
      billid: bill.id,
      poNumber: jobOrder.poNumber,
      codetoinvoice: jobOrder.codetoinvoice,
      customerId: customer.id.toString(),
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.tel,
      deliveryAddress: customer.address,
      key: jobOrder.urlPo.length ? jobOrder.urlPo : [],
      supervisors: supervisors ?? [],
      technicians: technicians ?? [],
      deliveryStaff,
      vatRate: bill.vatRate,
      steel: jobOrder.Product.map((p) => ({
        steelType: p.SteelType.codeSteel, // SteelType เป็น non-null ตาม schema
        amount: p.amount,
        width: p.wide ?? undefined,
        length: p.length ?? undefined,
        thickness: p.thickness ?? undefined,
        price: p.unitPrice,
        density: p.SteelType.density,
        detail: p.detail ?? undefined,
        shape: p.SteelType.shape as ShapeSteel,
        cuttingMethod: (p.cuttingMethod ?? "normal") as CuttingMethod,
        job: p.job ?? undefined,
        weight: p.actualWeight ?? null,
        discount: p.discount ?? null,
        isOD: p.isOD,
        isServices: p.isServices,
        isPerAmount: p.isPerAmount,
      })),
      status: jobOrder.status,
      // createdAt จาก OrderPO เอง (ตาม schema)
      createdAt: jobOrder.createdAt,
      updatedAt: jobOrder.updatedAt,
      // deliveryDate ต้องมาจาก Bill (บังคับมีค่าใน schema)
      deliveryDate: bill.deliveryDate,
    };

    return NextResponse.json(apiJobOrder, { status: 200 });
  } catch (error) {
    console.error("Database error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch OrderPO";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const ALLOWED_ROLES_BY_STATUS: Record<string, string[]> = {
  pending: ["superadmin", "supervisor", "clerk"],
  cutting: ["superadmin", "supervisor", "clerk"],
  weighing: ["superadmin", "supervisor", "clerk"],
  ready: ["superadmin", "supervisor", "clerk", "delivery"],
  shipped: ["superadmin", "clerk", "delivery", "supervisor"],
  completed: ["superadmin", "clerk", "delivery", "supervisor"],
  canceled: ["superadmin", "supervisor", "clerk", "delivery"],
};

const STATUS_OPTIONS = Object.keys(ALLOWED_ROLES_BY_STATUS);
//update status
// PATCH /api/job-order-detail/[id]
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const poId = Number(id);
    if (Number.isNaN(poId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    // 2. Validate Body
    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 },
      );
    }

    if (!STATUS_OPTIONS.includes(body.status)) {
      return NextResponse.json(
        {
          error: `Invalid status value. Allowed: ${STATUS_OPTIONS.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const requiredRoles = ALLOWED_ROLES_BY_STATUS[body.status] || [
      "superadmin",
    ];

    const authResult = await requireAuth(
      requiredRoles as ("superadmin" | "supervisor" | "clerk" | "delivery")[],
    );
    if ("response" in authResult) {
      return authResult.response;
    }
    const { session } = authResult;

    if (body.status === "ready") {
      const po = await prisma.orderPO.findUnique({
        where: { id: poId },
        select: {
          status: true,
          Product: { select: { actualWeight: true, isPerAmount: true } },
        },
      });

      if (!po) {
        return NextResponse.json(
          { error: "Job order not found" },
          { status: 404 },
        );
      }

      const hasMissingWeight = po.Product.some(
        (p) =>
          p.isPerAmount === false &&
          (p.actualWeight === null || p.actualWeight <= 0),
      );

      if (hasMissingWeight) {
        return NextResponse.json(
          {
            error:
              "ไม่สามารถเปลี่ยนเป็น READY ได้กรุณากรอกน้ำหนักเหล็กในรายการที่คิดราคาตามน้ำหนัก",
          },
          { status: 400 },
        );
      }
    }

    // ✅ ตรวจสอบ transition rules
    const poCurrent = await prisma.orderPO.findUnique({
      where: { id: poId },
      select: { status: true },
    });

    if (!poCurrent) {
      return NextResponse.json(
        { error: "Job order not found" },
        { status: 404 },
      );
    }

    // ❌ ถ้ายกเลิกแล้ว ห้ามเปลี่ยนสถานะต่อ
    if (poCurrent.status === "canceled") {
      return NextResponse.json(
        { error: "ออเดอร์ถูกยกเลิกแล้ว ไม่สามารถเปลี่ยนสถานะได้" },
        { status: 400 },
      );
    }

    // ✅ ถ้าจะเปลี่ยนเป็น canceled
    if (body.status === "canceled") {
      // ❌ ห้ามยกเลิกหลังจัดส่ง/เสร็จ
      if (poCurrent.status === "shipped" || poCurrent.status === "completed") {
        return NextResponse.json(
          { error: "ไม่สามารถยกเลิกได้: ออเดอร์ถูกจัดส่งหรือเสร็จสิ้นแล้ว" },
          { status: 400 },
        );
      }
    }

    // 4. Update Database

    const result = await prisma.orderPO.update({
      where: { id: poId },
      data: { status: body.status },
    });

    if (body.status === "shipped" && result.billId !== null) {
      const havedeliveredBy = await prisma.bill.findUnique({
        where: { id: result.billId },
        select: { deliveredById: true, deliveredBy: true },
      });

      //ดูว่าในseession มี user จริงมั้ย
      const actorStaff = await prisma.staff.findFirst({
        where: { userId: Number(session.user?.id) },
        select: { id: true, user: { select: { name: true } } },
      });

      await prisma.bill.update({
        where: { id: result.billId },
        data: {
          dateReceive: new Date(),
          deliveredById: havedeliveredBy?.deliveredById ?? actorStaff?.id,
          deliveredBy: havedeliveredBy?.deliveredBy ?? actorStaff?.user?.name,
        },
      });
    }

    return NextResponse.json(
      {
        message: "Status updated successfully",
        status: result.status,
        updatedAt: result.updatedAt,
      },
      { status: 200 },
    );
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Job order not found" },
        { status: 404 },
      );
    }

    console.error("Update Order Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
