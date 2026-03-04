"use client";
import React, { useCallback, useEffect, useState } from "react";
import StatementTable from "../../components/statement/StatementTable";
import type { Statement } from "../../components/statement/StatementTable";
import CreateStatementDialog from "../../components/statement/CreateStatementDialog";

type StatementListItem = {
  id: number;
  statementNo: number;
  customerId: number;
  createdAt: string;
  updatedAt: string;
};

type StatementDetailApiResponse = {
  statement: {
    id: number;
    statementNo: number;
    customerId: number;
    createdAt: string;
    updatedAt: string;
    Customer?: {
      id: number;
      name: string;
    } | null;
    items?: Array<{
      statementId: number;
      invoiceId: number;
      invoice?: {
        id: number;
        invoiceNo: number;
        createdAt: string;
        OrderPO?: {
          bill?: {
            grandTotal?: number | null;
            id: number;
          } | null;
        } | null;
      } | null;
    }>;
  };
  totals?: {
    countInvoices?: number;
    grandTotal?: number;
  };
};

const PAGE_SIZE = 10;

export default function StatementPage() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [customers, setCustomers] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchStatements = useCallback(async (currentPage: number) => {
    setLoading(true);
    try {
      const listRes = await fetch(
        `/api/statement?limit=${PAGE_SIZE}&page=${currentPage}`,
        { cache: "no-store" },
      );

      if (!listRes.ok) {
        throw new Error("Failed to fetch statement list");
      }

      const listJson: {
        statementItems?: StatementListItem[];
        total?: number;
      } = await listRes.json();

      const statementItems = Array.isArray(listJson.statementItems)
        ? listJson.statementItems
        : [];
      const customerMap = new Map<number, string>();

      const customersRes = await fetch("/api/statement/customer", {
        cache: "no-store",
      });
      if (customersRes.ok) {
        const customersJson: Array<{ id: number; name: string }> =
          await customersRes.json();
        customersJson.forEach((customer) => {
          customerMap.set(customer.id, customer.name);
        });
        setCustomers(
          Array.from(customerMap.entries()).map(([id, name]) => ({ id, name })),
        );
      } else {
        console.error("Failed to fetch /api/statement/customer", {
          status: customersRes.status,
        });
      }

      const detailResults = await Promise.all(
        statementItems.map(async (item) => {
          try {
            const detailRes = await fetch(`/api/statement/${item.id}`, {
              cache: "no-store",
            });

            if (!detailRes.ok) return null;

            const detailJson: StatementDetailApiResponse =
              await detailRes.json();
            return detailJson;
          } catch {
            return null;
          }
        }),
      );

      const mappedStatements: Statement[] = statementItems.map(
        (item, index) => {
          const detail = detailResults[index];
          const detailInvoices = detail?.statement?.items ?? [];
          return {
            id: item.id,
            statementNo: item.statementNo,
            customerId: item.customerId,
            customerName:
              detail?.statement?.Customer?.name ?? `ลูกค้า #${item.customerId}`,
            createdAt: item.createdAt,
            totalIncome: detail?.totals?.grandTotal ?? 0,
            invoiceCount:
              detail?.totals?.countInvoices ?? detailInvoices.length,
            invoices: detailInvoices
              .filter((invoiceItem) => invoiceItem.invoice)
              .map((invoiceItem) => ({
                id: invoiceItem.invoice!.id,
                invoiceNo: invoiceItem.invoice!.invoiceNo,
                total: invoiceItem.invoice?.OrderPO?.bill?.grandTotal ?? 0,
                createdAt: invoiceItem.invoice!.createdAt,
                billId: invoiceItem.invoice?.OrderPO?.bill?.id ?? null,
              })),
          };
        },
      );

      setStatements(mappedStatements);

      const total = typeof listJson.total === "number" ? listJson.total : 0;
      setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
    } catch (error) {
      console.error("Failed to fetch statements", error);
      setStatements([]);
      setCustomers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatements(page);
  }, [page, fetchStatements]);

  const handleCreateStatement = async (data: {
    customerId: number;
    date: string;
    invoiceIds: number[];
  }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/statement/create-with-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: data.customerId,
          invoiceIds: data.invoiceIds,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create statement");
      }

      setPage(1);
      await fetchStatements(1);
    } catch (error) {
      console.error("Failed to create statement", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStatement = async (
    statementId: number,
    payload: { invoiceIds: number[]; statementDate?: string },
  ) => {
    try {
      const res = await fetch("/api/statement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statementId,
          invoiceIds: payload.invoiceIds,
          statementDate: payload.statementDate,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update statement invoices");
      }

      await fetchStatements(page);
    } catch (error) {
      console.error("Failed to update statement", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 md:p-8 transition-colors duration-300 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            ใบเสร็จรับเงิน
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            รายการใบเสร็จรับเงินทั้งหมดที่ออกให้ลูกค้า
          </p>
        </div>
        <CreateStatementDialog
          customers={customers}
          onCreate={handleCreateStatement}
          loading={loading}
        />
      </div>

      <StatementTable
        data={statements}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={handleEditStatement}
      />
    </div>
  );
}
