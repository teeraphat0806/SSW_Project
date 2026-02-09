"use client";
import React from "react";
import { Search, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useExpenseContext } from "@/contexts/ExpenseContext";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import { toast } from "react-toastify";

const ExpenseTable = () => {
  const { expenses, pagination, isLoading, error, refreshExpenses } =
    useExpenseContext();
  const confirm = useConfirm();

  // ฟังก์ชันฟอร์แมตวันที่
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // ฟังก์ชันฟอร์แมตตัวเลข
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // ฟังก์ชันลบข้อมูล
  const handleDelete = async ({
    expenseId,
    description,
  }: {
    expenseId: number;
    description: string;
  }) => {
    console.log(
      `🗑️ Attempting to delete expense: ID=${expenseId}, Description="${description}"`,
    );

    const isConfirmed = await confirm({
      title: "⚠️ ยืนยันการลบค่าใช้จ่าย",
      description: `คุณแน่ใจหรือไม่ที่จะลบรายการนี้?\n\nรายการ: ${description}\n\n⚠️ การลบนี้ไม่สามารถกู้คืนได้`,
      variant: "destructive",
      confirmText: "ยืนยันการลบ",
      cancelText: "ยกเลิก",
    });

    console.log(`User confirmation result: ${isConfirmed}`);

    if (!isConfirmed) {
      console.log("❌ User cancelled deletion");
      return;
    }

    try {
      console.log(`🔗 API Call: DELETE /api/expense/${expenseId}`);

      const response = await fetch(`/api/expense/${expenseId}`, {
        method: "DELETE",
      });

      console.log(`📥 API Response Status: ${response.status}`);
      const data = await response.json();
      console.log("📥 API Response Data:", data);

      if (response.ok) {
        console.log("✅ Expense deleted successfully!");
        toast.success(`ลบค่าใช้จ่ายสำเร็จ\nรายการ: ${description}`, {
          position: "bottom-right",
          autoClose: 3000,
        });
        // รีเฟรชข้อมูล
        refreshExpenses();
      } else {
        console.log("❌ Failed to delete expense:", data);
        toast.error(
          `❌ ${data.error || "ลบค่าใช้จ่ายไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"}`,
          {
            position: "bottom-right",
            autoClose: 5000,
          },
        );
      }
    } catch (error) {
      console.error("❌ Delete error (Network/Exception):", error);
      toast.error("❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", {
        position: "bottom-right",
        autoClose: 5000,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900/50 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-zinc-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-100 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-300">
              <th className="p-4 font-semibold text-sm uppercase tracking-wider text-center">
                ลำดับที่
              </th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wider">
                วันที่
              </th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wider">
                รายละเอียด
              </th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wider">
                ประเภท
              </th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wider">
                พนักงาน
              </th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wider text-right">
                จำนวนเงิน
              </th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wider text-center">
                จัดการ
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-zinc-700/50 bg-white dark:bg-zinc-900 relative">
            {isLoading && expenses.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-zinc-400">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span>กำลังโหลดข้อมูล...</span>
                  </div>
                </td>
              </tr>
            )}

            {error && !isLoading && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-red-500">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8" />
                    <span>เกิดข้อผิดพลาด: {error}</span>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              !error &&
              expenses.map((item, index) => {
                const rowNumber =
                  (pagination.page - 1) * pagination.limit + index + 1;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50 dark:hover:bg-zinc-800/40 transition-colors duration-150"
                  >
                    <td className="p-4 text-center">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">
                        {rowNumber}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {formatDate(item.expenseDate)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          ID: {item.id}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {item.description || "-"}
                        </p>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                        {item.category?.name || "ไม่ระบุ"}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.category?.Staff?.user?.name || "ไม่ระบุ"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {item.category?.Staff?.position || "-"}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <span className="font-mono font-semibold text-lg text-gray-700 dark:text-gray-300">
                        {formatNumber(item.amount)} ฿
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                        title="ลบ"
                        onClick={() =>
                          handleDelete({
                            expenseId: item.id,
                            description: item.description,
                          })
                        }
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {!isLoading && !error && expenses.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <Search className="w-12 h-12 mb-3 opacity-20" />
            <p>ไม่พบข้อมูลค่าใช้จ่าย</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseTable;
