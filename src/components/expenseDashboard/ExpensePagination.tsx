"use client";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useExpenseContext } from "@/contexts/ExpenseContext";

const ExpensePagination = () => {
  const { pagination, isLoading, handlePageChange } = useExpenseContext();

  // Don't render if loading or only one page
  if (isLoading || pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto mt-6 flex items-center justify-between">
      <div className="text-sm text-gray-500 dark:text-zinc-400">
        หน้า {pagination.page} จาก {pagination.totalPages}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
          ก่อนหน้า
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
            .filter((page) => {
              const current = pagination.page;
              return (
                page === 1 ||
                page === pagination.totalPages ||
                (page >= current - 1 && page <= current + 1)
              );
            })
            .map((page, index, array) => (
              <React.Fragment key={page}>
                {index > 0 && array[index - 1] !== page - 1 && (
                  <span className="px-2 text-gray-400">...</span>
                )}
                <button
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-lg transition ${
                    page === pagination.page
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            ))}
        </div>

        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          ถัดไป
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ExpensePagination;
