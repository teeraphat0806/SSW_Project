import { Employee } from "../../types/payroll";
import { FileText } from "lucide-react";
import { useEffect } from "react";

interface EmployeeOverviewProps {
  employees: Employee[];
  onGeneratePayslip: (employee: Employee) => void;
}

export const EmployeeOverview = ({
  employees,
  onGeneratePayslip,
}: EmployeeOverviewProps) => {
  const totalMonthlySalary = employees.reduce(
    (sum, emp) => sum + emp.currentSalary,
    0,
  );
  useEffect(() => {
    console.log("arm", employees);
  }, []);
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          เงินเดือนพนักงานทั้งหมด
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          ข้อมูลเงินเดือนพนักงานทั้งหมดในระบบ
        </p>
      </div>
      <div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-500 rounded-lg p-6">
              <div className="pt-3">
                <div className="text-2xl font-bold text-white">
                  ฿{totalMonthlySalary.toLocaleString()}
                </div>
                <p className="text-sm text-gray-200">
                  ยอดเงินเดือนรวมทั้งบริษัทประจำเดือนนี้
                </p>
              </div>
            </div>
            <div className="border rounded-lg p-6 bg-gray-50 dark:bg-zinc-900">
              <div className="pt-3">
                <div className="text-2xl font-bold text-secondary">
                  {employees.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  จำนวนพนักงานทั้งหมด
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-700">
                    <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      รหัสพนักงาน
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      ชื่อ
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      ตำแหน่ง
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">
                      เงินเดือน
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">
                      สลิปเงินเดือน
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-150"
                    >
                      <td className="py-4 px-6">
                        <span className="font-mono text-sm font-medium text-zinc-700 dark:text-zinc-200">
                          {employee.code}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {employee?.name || "arm"}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                          {employee.jobPosition?.name || "-"}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <span className="font-mono text-sm font-medium text-zinc-700 dark:text-zinc-200">
                          ฿{employee.currentSalary.toLocaleString()}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => onGeneratePayslip(employee)}
                          className="p-2 rounded-lg flex flex-row items-center gap-2 text-green-400 hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 dark:hover:text-green-400 hover:cursor-pointer transition-all mx-auto font-semibold"
                        >
                          <FileText size={18} />
                          ดาวน์โหลดสลิป
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
