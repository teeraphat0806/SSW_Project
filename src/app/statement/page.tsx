"use client";
import React, { useState } from "react";
import StatementTable from "../../components/statement/StatementTable";
import type { Statement } from "../../components/statement/StatementTable";
import CreateStatementDialog from "../../components/statement/CreateStatementDialog";

// Mock customer data
const customers = [
  { id: 1, name: "บริษัท เอ บี ซี จำกัด" },
  { id: 2, name: "บริษัท ดี อี เอฟ จำกัด" },
];

// Mock statement data
const mockStatements: Statement[] = [
  {
    id: 1,
    statementNo: 100001,
    customerName: "บริษัท เอ บี ซี จำกัด",
    createdAt: new Date().toISOString(),
    totalIncome: 50000,
    invoiceCount: 3,
  },
  {
    id: 2,
    statementNo: 100002,
    customerName: "บริษัท ดี อี เอฟ จำกัด",
    createdAt: new Date().toISOString(),
    totalIncome: 30000,
    invoiceCount: 2,
  },
];

export default function StatementPage() {
  const [statements, setStatements] = useState<Statement[]>(mockStatements);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const totalPages = 1; // mock only

  // TODO: fetch real data from API

  const handleCreateStatement = (data: {
    customerId: number;
    date: string;
    invoiceIds: number[];
  }) => {
    // TODO: call API to create statement
    // For now, just add mock
    setStatements((prevStatements) => {
      const arr = Array.isArray(prevStatements) ? prevStatements : [];
      return [
        {
          id: arr.length + 1,
          statementNo: 100000 + arr.length + 1,
          customerName:
            customers.find((c) => c.id === data.customerId)?.name || "",
          createdAt: data.date,
          totalIncome: 99999, // mock
          invoiceCount: data.invoiceIds.length,
        },
        ...arr,
      ];
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 md:p-8 transition-colors duration-300 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            ใบวางบิล
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            รายการใบวางบิลที่ถูกสร้าง
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
      />
    </div>
  );
}
