import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Employee, SalaryAdjustment } from "../../types/payroll";
import { ToastContainer, toast } from "react-toastify";
interface JobPosition {
  id: number;
  name: string;
  baseSalary: number;
}
interface SalaryAdjustmentFormProps {
  employees: Employee[];
  onAdjustmentSubmit: (
    adjustment: Omit<SalaryAdjustment, "id" | "date" | "type">,
  ) => void;
  onEmployeeChange?: (staffId: string) => void;
  adjustmentType: "salary" | "other";
}

export const SalaryAdjustmentForm = ({
  employees,
  onAdjustmentSubmit,
  onEmployeeChange,
  adjustmentType,
}: SalaryAdjustmentFormProps) => {
  const [selectedstaffId, setSelectedstaffId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [detail, setdetail] = useState<string>("");
  useEffect(() => {
    console.log("employee: ", employees);
  }, []);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedstaffId || !amount || !detail) {
      toast.error("Please fill in all fields", {
        position: "bottom-right",
      });
      return;
    }

    const adjustmentAmount = parseFloat(amount);
    if (isNaN(adjustmentAmount)) {
      toast.error("Please enter a valid amount", {
        position: "bottom-right",
      });
      return;
    }

    onAdjustmentSubmit({
      staffId: selectedstaffId,
      amount: adjustmentAmount,
      detail,
    });

    // Reset amount/detail but keep employee selection for latest panel sync
    setAmount("");
    setdetail("");

    toast.success(
      `Salary ${
        adjustmentAmount >= 0 ? "increased" : "decreased"
      } successfully`,
      {
        position: "bottom-right",
      },
    );
  };
  const selectedEmployee = employees.find(
    (emp) => Number(emp.id) === Number(selectedstaffId),
  );
  // useEffect(()=>{console.log("selectEmployee: ",selectedEmployee)},[selectedEmployee])
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);

  // ✅ Fetch positions
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await fetch("/api/jobPosition", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setJobPositions(data);
        }
      } catch (error) {
        console.error("Error fetching positions:", error);
      }
    };
    fetchPositions();
  }, []);

  // ✅ แสดงเงินเดือนปัจจุบันและเงินเดือนเริ่มต้นของตำแหน่ง
  const selectedEmpData = employees.find(
    (e) => e.id.toString() === selectedstaffId,
  );
  const baseSalary = selectedEmpData?.jobPosition?.baseSalary || 0;
  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="employee">เลือกพนักงาน</Label>

          <Select
            value={selectedstaffId}
            onValueChange={(value) => {
              setSelectedstaffId(value);
              onEmployeeChange?.(value);
            }}
          >
            <SelectTrigger className="bg-background text-muted-foreground border border-gray-300 shadow-sm">
              <SelectValue placeholder="เลือกพนักงาน" />
            </SelectTrigger>
            <SelectContent className="bg-background text-muted-foreground border border-gray-200 shadow-lg">
              {employees.map((employee) => (
                <SelectItem
                  key={employee.id}
                  value={String(employee.id)}
                  className="bg-background text-muted-foreground hover:bg-blue-500 cursor-pointer group"
                >
                  <div className="flex flex-col">
                    <span className="font-medium group-hover:text-white">
                      {employee.name} ({employee.code})
                    </span>
                    <span className="text-xs text-gray-500 group-hover:text-white">
                      เงินเดือนปัจจุบัน: ฿
                      {employee.currentSalary.toLocaleString()}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedEmpData && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-2">
            <p className="text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                ตำแหน่ง:{" "}
              </span>
              <span className="font-semibold">
                {selectedEmpData.jobPosition?.name || "-"}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                เงินเดือนเริ่มต้น:{" "}
              </span>
              <span className="font-semibold">
                {baseSalary.toLocaleString("th-TH", {
                  style: "currency",
                  currency: "THB",
                })}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                เงินเดือนปัจจุบัน:{" "}
              </span>
              <span className="font-semibold">
                {selectedEmpData.currentSalary.toLocaleString("th-TH", {
                  style: "currency",
                  currency: "THB",
                })}
              </span>
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="amount">ยอดเงินที่ต้องการปรับ (บวก/ลบ)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder={
              adjustmentType === "salary"
                ? "เช่น +5000 เพื่อเพิ่ม หรือ -1000 เพื่อลดเงินเดือน"
                : "เช่น +500 เพื่อเพิ่ม OT หรือ -200 เพื่อลดค่าปรับ"
            }
            value={amount}
            className="bg-background border-1 border-black "
            inputMode="decimal"
            pattern="^-?\\d*(\\.\\d*)?$"
            onKeyDown={(e) => {
              // บล็อค e/E/+ เพื่อไม่ให้ใส่ค่าแบบ scientific
              if (["e", "E", "+"].includes(e.key)) {
                e.preventDefault();
                return;
              }
              // อนุญาตให้มีเครื่องหมายลบแค่ตัวเดียวและต้องอยู่ตำแหน่งแรก
              if (e.key === "-") {
                const hasMinus = amount.includes("-");
                const cursor =
                  (e.target as HTMLInputElement).selectionStart ?? 0;
                if (hasMinus || cursor !== 0) {
                  e.preventDefault();
                }
              }
            }}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {adjustmentType === "salary"
              ? "ใส่จำนวนเป็นบวก (+) เพื่อเพิ่มเงินเดือน หรือติดลบ (-) เพื่อลดเงินเดือน"
              : "ใส่จำนวนเป็นบวก (+) เพื่อเพิ่มรายได้อื่น เช่น OT / ใส่ลบ (-) เพื่อหักรายได้เฉพาะงวดนี้"}
          </p>
          {selectedEmployee && amount && !isNaN(parseFloat(amount)) && (
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {adjustmentType === "salary"
                  ? "เงินเดือนใหม่จะเป็น: ฿" +
                    (
                      selectedEmployee.currentSalary + parseFloat(amount)
                    ).toLocaleString()
                  : "ยอดปรับรอบนี้: ฿" + parseFloat(amount).toLocaleString()}
              </p>
              {adjustmentType === "salary" && (
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  ({selectedEmployee.currentSalary.toLocaleString()}" "
                  {parseFloat(amount) >= 0 ? "+" : ""}" "
                  {parseFloat(amount).toLocaleString()})
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="detail">รายละเอียด</Label>
          <Textarea
            id="detail"
            placeholder="ใส่เหตุผลการปรับเงินเดือน เช่น การประเมินผลงาน, การเลื่อนตำแหน่ง ฯลฯ"
            value={detail}
            onChange={(e) => setdetail(e.target.value)}
            rows={3}
            className="bg-background border-1 border-black "
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 hover:cursor-pointer hover:scale-110 transition-all text-white font-bold "
        >
          ตกลง
        </Button>
      </form>
      <ToastContainer />
    </div>
  );
};
