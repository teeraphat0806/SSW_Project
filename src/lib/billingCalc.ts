import prisma from "@/lib/prisma";

type BreakdownRow = {
  invoiceId: number;
  invoiceNo: number;
  orderPOId: number;
  billId: number;
  billSubtotal: number;
  billVat: number;
  billDiscount: number;
  billGrandTotal: number;
};

export type TotalsResult = {
  countInvoices: number;
  subtotal: number;
  vat: number;
  discount: number;
  grandTotal: number;
  breakdown: BreakdownRow[];
};

const n = (x: number | null | undefined) => (typeof x === "number" ? x : 0);

function mustHaveBill(bill: any, orderPOId: number, invoiceId: number) {
  if (!bill) {
    const err = new Error(
      `Invoice ${invoiceId} -> OrderPO ${orderPOId} has no Bill`,
    );
    (err as any).code = "BILL_MISSING";
    (err as any).orderPOId = orderPOId;
    (err as any).invoiceId = invoiceId;
    throw err;
  }
}

export function calcStatementTotalsFromItems(
  items: any[],
): TotalsResult {
  const breakdown = items.map((it: any) => {
    const inv = it.invoice;
    const po = inv.OrderPO;
    const bill = po.bill;
    mustHaveBill(bill, po.id, inv.id);
    const safeBill = bill as NonNullable<typeof bill>;
    return {
      invoiceId: inv.id,
      invoiceNo: inv.invoiceNo,
      orderPOId: po.id,
      billId: safeBill.id,
      billSubtotal: n(safeBill.subtotal),
      billVat: n(safeBill.vat),
      billDiscount: n(safeBill.discount),
      billGrandTotal: n(safeBill.grandTotal),
    };
  });

  const subtotal = breakdown.reduce((s, r) => s + r.billSubtotal, 0);
  const vat = breakdown.reduce((s, r) => s + r.billVat, 0);
  const discount = breakdown.reduce((s, r) => s + r.billDiscount, 0);
  const grandTotal = breakdown.reduce((s, r) => s + r.billGrandTotal, 0);

  return {
    countInvoices: breakdown.length,
    subtotal,
    vat,
    discount,
    grandTotal,
    breakdown,
  };
}

export async function calcStatementTotals(
  statementId: number,
): Promise<TotalsResult> {
  const items = await prisma.statementInvoice.findMany({
    where: { statementId },
    include: {
      invoice: {
        include: { OrderPO: { include: { bill: true } } },
      },
    },
  });

  return calcStatementTotalsFromItems(items);
}

export function calcAcquittanceTotalsFromItems(
  items: any[],
): TotalsResult {
  const breakdown = items.map((it: any) => {
    const inv = it.invoice;
    const po = inv.OrderPO;
    const bill = po.bill;
    mustHaveBill(bill, po.id, inv.id);
    const safeBill = bill as NonNullable<typeof bill>;
    return {
      invoiceId: inv.id,
      invoiceNo: inv.invoiceNo,
      orderPOId: po.id,
      billId: safeBill.id,
      billSubtotal: n(safeBill.subtotal),
      billVat: n(safeBill.vat),
      billDiscount: n(safeBill.discount),
      billGrandTotal: n(safeBill.grandTotal),
    };
  });

  const subtotal = breakdown.reduce((s, r) => s + r.billSubtotal, 0);
  const vat = breakdown.reduce((s, r) => s + r.billVat, 0);
  const discount = breakdown.reduce((s, r) => s + r.billDiscount, 0);
  const grandTotal = breakdown.reduce((s, r) => s + r.billGrandTotal, 0);

  return {
    countInvoices: breakdown.length,
    subtotal,
    vat,
    discount,
    grandTotal,
    breakdown,
  };
}

export async function calcAcquittanceTotals(
  acquittanceId: number,
): Promise<TotalsResult> {
  const items = await prisma.acquittanceInvoice.findMany({
    where: { acquittanceId },
    include: {
      invoice: {
        include: { OrderPO: { include: { bill: true } } },
      },
    },
  });

  return calcAcquittanceTotalsFromItems(items);
}
