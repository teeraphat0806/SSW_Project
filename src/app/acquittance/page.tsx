"use client";
import React, { useCallback, useEffect, useState } from "react";
import AcquittanceTable from "@/components/acquittance/AcquittanceTable";
import type { Acquittance } from "@/components/acquittance/AcquittanceTable";
import CreateAcquittanceDialog from "@/components/acquittance/CreateAcquittanceDialog";
type acquittanceListItem = {
  id: number;
  acquittanceNo: number | null;
  customerId: number;
  createdAt: string;
  updatedAt: string;
};

type acquittanceDetailApiResponse = {
  acquittance: {
    id: number;
    acquittanceNo: number | null;
    customerId: number;
    createdAt: string;
    updatedAt: string;
    Customer?: {
      id: number;
      name: string;
    } | null;
    items?: Array<{
      acquittanceId: number;
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

export default function acquittancePage() {
  const [acquittances, setAcquittances] = useState<Acquittance[]>([]);
  const [customers, setCustomers] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [nextAcquittanceNo, setNextAcquittanceNo] = useState<number | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchAcquittances = useCallback(
    async (
      currentPage: number,
      search?: string,
      from?: string,
      to?: string,
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: PAGE_SIZE.toString(),
          page: currentPage.toString(),
        });

        if (search) params.append("search", search);
        if (from) params.append("dateFrom", from);
        if (to) params.append("dateTo", to);

        const listRes = await fetch(`/api/acquittance?${params.toString()}`, {
          cache: "no-store",
        });

        if (!listRes.ok) {
          throw new Error("Failed to fetch acquittance list");
        }

        const listJson: {
          acquittanceItems?: acquittanceListItem[];
          total?: number;
          nextAcquittanceNo?: number;
        } = await listRes.json();

        const acquittanceItems = Array.isArray(listJson.acquittanceItems)
          ? listJson.acquittanceItems
          : [];
        const customerMap = new Map<number, string>();

        const customersRes = await fetch("/api/acquittance/customer", {
          cache: "no-store",
        });
        if (customersRes.ok) {
          const customersJson: Array<{ id: number; name: string }> =
            await customersRes.json();
          customersJson.forEach((customer) => {
            customerMap.set(customer.id, customer.name);
          });
          setCustomers(
            Array.from(customerMap.entries()).map(([id, name]) => ({
              id,
              name,
            })),
          );
        } else {
          console.error("Failed to fetch /api/acquittance/customer", {
            status: customersRes.status,
          });
        }

        const detailResults = await Promise.all(
          acquittanceItems.map(async (item) => {
            try {
              const detailRes = await fetch(`/api/acquittance/${item.id}`, {
                cache: "no-store",
              });

              if (!detailRes.ok) return null;

              const detailJson: acquittanceDetailApiResponse =
                await detailRes.json();
              return detailJson;
            } catch {
              return null;
            }
          }),
        );

        const mappedAcquittances: Acquittance[] = acquittanceItems.map(
          (item, index) => {
            const detail = detailResults[index];
            const detailInvoices = detail?.acquittance?.items ?? [];
            return {
              id: item.id,
              acquittanceNo: item.acquittanceNo,
              customerId: item.customerId,
              customerName:
                detail?.acquittance?.Customer?.name ??
                `ลูกค้า #${item.customerId}`,
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

        setAcquittances(mappedAcquittances);

        const total = typeof listJson.total === "number" ? listJson.total : 0;
        setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
        setNextAcquittanceNo(
          typeof listJson.nextAcquittanceNo === "number"
            ? listJson.nextAcquittanceNo
            : null,
        );
      } catch (error) {
        console.error("Failed to fetch acquittances", error);
        setAcquittances([]);
        setCustomers([]);
        setTotalPages(1);
        setNextAcquittanceNo(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    console.log("Fetching with:", { page, searchTerm, dateFrom, dateTo });
    void fetchAcquittances(page, searchTerm, dateFrom, dateTo);
  }, [page, searchTerm, dateFrom, dateTo, fetchAcquittances]);

  const handleCreateAcquittance = async (data: {
    customerId: number;
    date: string;
    invoiceIds: number[];
  }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/acquittance/create-with-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: data.customerId,
          invoiceIds: data.invoiceIds,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create acquittance");
      }

      setPage(1);
      await fetchAcquittances(1, searchTerm, dateFrom, dateTo);
    } catch (error) {
      console.error("Failed to create acquittance", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAcquittance = async (
    acquittanceId: number,
    payload: { invoiceIds: number[]; acquittanceDate?: string },
  ) => {
    try {
      const res = await fetch("/api/acquittance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acquittanceId,
          invoiceIds: payload.invoiceIds,
          acquittanceDate: payload.acquittanceDate,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update acquittance invoices");
      }

      await fetchAcquittances(page, searchTerm, dateFrom, dateTo);
    } catch (error) {
      console.error("Failed to update acquittance", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 md:p-8 transition-colors duration-300 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            ใบวางบิล
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            รายการใบวางบิลทั้งหมดที่ออกให้ลูกค้า
          </p>
        </div>
        <CreateAcquittanceDialog
          customers={customers}
          onCreate={handleCreateAcquittance}
          loading={loading}
        />
      </div>
      <AcquittanceTable
        data={acquittances}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={handleEditAcquittance}
        nextAcquittanceNo={nextAcquittanceNo}
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          console.log("Search changed to:", value);
          setSearchTerm(value);
          setPage(1);
        }}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={(value) => {
          console.log("DateFrom changed to:", value);
          setDateFrom(value);
          setPage(1);
        }}
        onDateToChange={(value) => {
          console.log("DateTo changed to:", value);
          setDateTo(value);
          setPage(1);
        }}
        onClearFilters={() => {
          console.log("Clearing filters");
          setSearchTerm("");
          setDateFrom("");
          setDateTo("");
          setPage(1);
        }}
      />
    </div>
  );
}
