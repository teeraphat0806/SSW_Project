"use client";

import { Eye, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MonthlyDataItem {
  month: number;
  monthName: string;
  salesAmt: number;
  salesQty: number;
  income: number;
  expense: number;
  net: number;
  formatted: {
    salesAmt: string;
    salesQty: string;
    income: string;
    expense: string;
    net: string;
  };
}

interface MonthlyDataTableProps {
  data: MonthlyDataItem[];
  year: number;
}

export function MonthlyDataTable({ data, year }: MonthlyDataTableProps) {
  const router = useRouter();

  const handleViewDetails = (month: number) => {
    router.push(`/saledashboard2/${year}/${month}`);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-700">
              <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                เดือน
              </th>
              <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">
                ยอดขาย (เงิน)
              </th>
              <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">
                ยอดขาย (จำนวน)
              </th>
              <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">
                รายได้
              </th>
              <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">
                รายจ่าย
              </th>
              <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">
                กำไร/ขาดทุน
              </th>
              <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">
                รายละเอียด
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.length > 0 ? (
              data
                .filter((item) => item.salesAmt !== 0)
                .map((item) => (
                  <tr
                    key={item.month}
                    className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-150 cursor-pointer"
                    onClick={() => handleViewDetails(item.month)}
                  >
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.monthName}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <span className="font-mono text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        {item.formatted.salesAmt}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <span className="font-mono text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        {item.formatted.salesQty}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <span className="font-mono text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        {item.formatted.income}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <span className="font-mono text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        {item.formatted.expense}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <span
                        className={`font-mono text-sm font-semibold ${
                          item.net >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {item.formatted.net}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <Link href={`/saledashboard2/${year}/${item.month}`}>
                        <button
                          className="p-2 rounded-lg flex flex-row items-center gap-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <Edit size={18} /> แสดง
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                    <p className="text-sm">ไม่พบข้อมูล</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
