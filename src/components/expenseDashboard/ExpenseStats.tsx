"use client";
import React, { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useExpenseContext } from "@/contexts/ExpenseContext";

const ExpenseStats = () => {
  const { expenses, pagination, isLoading } = useExpenseContext();

  // คำนวณยอดรวมทั้งหมดในหน้าปัจจุบัน
  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  // ฟังก์ชันฟอร์แมตตัวเลข
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900/60 p-4 rounded-xl shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center border border-gray-100 dark:border-zinc-800">
      <div className="flex items-center gap-4">
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        )}
        <div className="text-sm">
          <span className="text-gray-500 dark:text-zinc-400">
            แสดง {expenses.length} รายการ
          </span>
          <span className="mx-2 text-gray-300 dark:text-zinc-600">|</span>
          <span className="text-gray-500 dark:text-zinc-400">
            ทั้งหมด {pagination.totalCount} รายการ
          </span>
        </div>
      </div>

      <div className="text-sm font-medium">
        <span className="text-gray-500 dark:text-zinc-400 mr-2">
          ยอดรวมหน้านี้:
        </span>
        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
          {formatNumber(totalAmount)} ฿
        </span>
      </div>
    </div>
  );
};

export default ExpenseStats;
