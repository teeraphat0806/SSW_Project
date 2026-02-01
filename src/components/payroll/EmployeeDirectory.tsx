"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Edit } from "lucide-react";
import { useState } from "react";
import type { Employee } from "@/types/payroll";

// Position mapping with Thai translations
const POSITION_ROLES = {
  superadmin: "ผู้จัดการระบบ",
  supervisor: "หัวหน้างาน",
  clerk: "เจ้าหน้าที่",
  cutter: "ช่างตัด",
  delivery: "ผู้จัดส่ง",
} as const;

type PositionRole = keyof typeof POSITION_ROLES;

// Thai banks list
const THAI_BANKS = [
  { code: "BBL", name: "ธนาคารกรุงเทพ" },
  { code: "KBANK", name: "ธนาคารกสิกรไทย" },
  { code: "KTB", name: "ธนาคารกรุงไทย" },
  { code: "BAY", name: "ธนาคารกรุงเทพ (ยูฟ่า)" },
  { code: "BEC", name: "ธนาคารเบสิค" },
  { code: "CIMB", name: "ธนาคารซีไอเอ็มบี ไทย" },
  { code: "TMRW", name: "ธนาคาร TMRW" },
  { code: "UOB", name: "ธนาคารยูโอบี" },
  { code: "SCB", name: "ธนาคารไทยพาณิชย์" },
  { code: "TTB", name: "ธนาคารทหารไทย" },
  { code: "GSB", name: "ธนาคารออมสิน" },
  { code: "ISBT", name: "ธนาคารอิสลามแห่งประเทศไทย" },
  { code: "LHBANK", name: "ธนาคารลาดหญ้า" },
  { code: "AYUDHYA", name: "ธนาคารพัฒนาวิสาหกิจขนาดกลางและขนาดย่อม" },
  { code: "TBANK", name: "ธนาคารไทยร่วมทุน" },
  { code: "TBANK2", name: "ธนาคารไทยเวธนะ" },
  { code: "TCAP", name: "ธนาคารซูมิโตโม มิตซูย ทrust" },
  { code: "ICBC", name: "ธนาคารอิศบร" },
  { code: "BCHT", name: "ธนาคารจีนแรนดส์" },
  { code: "JPYUAB", name: "ธนาคารยูเอเอ็บ" },
  { code: "RBS", name: "ธนาคารรอยัล แบงก์ ออฟ สกอตแลนด์" },
  { code: "AKBANK", name: "ธนาคารหาจัก" },
  { code: "MIZUHO", name: "ธนาคารมิซูโฮ" },
  { code: "MUFG", name: "ธนาคารมูฟจิ" },
  { code: "SUMITOMO", name: "ธนาคารซูมิโตโม มิตซูย ทรัสต์" },
  { code: "DBS", name: "ธนาคารดีบีเอส" },
  { code: "BOA", name: "ธนาคารบางกรรมการของอเมริกา" },
  { code: "ANZ", name: "ธนาคารเอเอ็นแซด" },
  { code: "CITI", name: "ธนาคารซิตี้แบงก์" },
  { code: "HSBC", name: "ธนาคารเอชเอสบีซี" },
  { code: "KDB", name: "ธนาคารเคดีบี" },
] as const;

interface EmployeeDirectoryProps {
  employees: Employee[];
}

export function EmployeeDirectory({ employees }: EmployeeDirectoryProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<Employee>>({});

  const handleViewDetails = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsDetailsOpen(true);
  };

  const handleEditClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEditData({
      name: emp.name,
      position: emp.position,
      bankName: emp.bankName,
      bankAccount: emp.bankAccount,
      taxid: emp.taxid,
      social_security: emp.social_security,
      startDate: emp.startDate,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEmployee) return;

    try {
      const response = await fetch(`/api/staff/${selectedEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        setIsEditOpen(false);
        // Refresh data
        window.location.reload();
      }
    } catch (error) {
      console.error("Error updating employee:", error);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-700">
              <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                ลำดับ
              </th>
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
              <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                วันที่เข้าทำงาน
              </th>
              <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">
                แก้ไข
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {employees.map((emp, idx) => (
              <tr
                key={emp.id}
                className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-150 cursor-pointer"
                onClick={() => handleViewDetails(emp)}
              >
                <td className="py-4 px-6 text-center">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {idx + 1}
                  </span>
                </td>

                <td className="py-4 px-6">
                  <span className="font-mono text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {emp.code}
                  </span>
                </td>

                <td className="py-4 px-6">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {emp.name}
                  </span>
                </td>

                <td className="py-4 px-6">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {POSITION_ROLES[emp.position as PositionRole] ||
                      emp.position}
                  </span>
                </td>

                <td className="py-4 px-6 text-right">
                  <span className="font-mono text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {emp.currentSalary?.toLocaleString("th-TH", {
                      style: "currency",
                      currency: "THB",
                    })}
                  </span>
                </td>

                <td className="py-4 px-6">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {new Date(emp.startDate).toLocaleDateString("th-TH")}
                  </span>
                </td>

                <td className="py-4 px-6 text-center">
                  <button
                    className="p-2 rounded-lg flex flex-row items-center gap-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all mx-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(emp);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    แก้ไข
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>ข้อมูลพนักงาน</DialogTitle>
          </DialogHeader>

          {selectedEmployee && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ชื่อ</p>
                <p className="font-semibold">{selectedEmployee.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">รหัสพนักงาน</p>
                <p className="font-semibold">{selectedEmployee.code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ตำแหน่ง</p>
                <p className="font-semibold">
                  {POSITION_ROLES[selectedEmployee.position as PositionRole] ||
                    selectedEmployee.position}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">เงินเดือน</p>
                <p className="font-semibold">
                  {selectedEmployee.currentSalary?.toLocaleString("th-TH", {
                    style: "currency",
                    currency: "THB",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ธนาคาร</p>
                <p className="font-semibold">{selectedEmployee.bankName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">เลขบัญชี</p>
                <p className="font-semibold font-mono">
                  {selectedEmployee.bankAccount}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  เลขประจำตัวผู้เสียภาษี
                </p>
                <p className="font-semibold font-mono">
                  {selectedEmployee.taxid}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  เลขที่ประจำตัวสังคม
                </p>
                <p className="font-semibold font-mono">
                  {selectedEmployee.social_security}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">วันที่เข้าทำงาน</p>
                <p className="font-semibold">
                  {new Date(selectedEmployee.startDate).toLocaleDateString(
                    "th-TH",
                  )}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="default"
              onClick={() => {
                setIsDetailsOpen(false);
                handleEditClick(selectedEmployee!);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              แก้ไขข้อมูล
            </Button>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลพนักงาน</DialogTitle>
          </DialogHeader>

          {selectedEmployee && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>ชื่อ</Label>
                <Input
                  value={editData.name || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label>ตำแหน่ง</Label>
                <Select
                  value={editData.position || ""}
                  onValueChange={(value) =>
                    setEditData({ ...editData, position: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="เลือกตำแหน่ง">
                      {editData.position
                        ? POSITION_ROLES[editData.position as PositionRole] ||
                          editData.position
                        : "เลือกตำแหน่ง"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(POSITION_ROLES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editData.position &&
                  !POSITION_ROLES[editData.position as PositionRole] && (
                    <p className="text-xs text-amber-600 mt-1">
                      ตำแหน่งปัจจุบัน: {editData.position} (ไม่อยู่ในรายการ)
                    </p>
                  )}
              </div>
              <div>
                <Label>ธนาคาร</Label>
                <Select
                  value={editData.bankName || ""}
                  onValueChange={(value) =>
                    setEditData({ ...editData, bankName: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="เลือกธนาคาร" />
                  </SelectTrigger>
                  <SelectContent>
                    {THAI_BANKS.map((bank, index) => (
                      <SelectItem
                        key={`${bank.code}-${index}`}
                        value={bank.name}
                      >
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>เลขบัญชี</Label>
                <Input
                  value={editData.bankAccount || ""}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 15);
                    setEditData({ ...editData, bankAccount: value });
                  }}
                  className="mt-1"
                  placeholder="กรุณาป้อน 10-15 หลัก หรือ ปล่อยว่างได้"
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editData.bankAccount
                    ? `${editData.bankAccount.length}/15 (ต้องมี 10-15 หลัก)`
                    : "ไม่บังคับ (10-15 หลัก)"}
                </p>
              </div>
              <div>
                <Label>เลขประจำตัวผู้เสียภาษี</Label>
                <Input
                  value={editData.taxid || ""}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 13);
                    setEditData({
                      ...editData,
                      taxid: value,
                    });
                  }}
                  className="mt-1"
                  placeholder="กรุณาป้อน 13 หลัก"
                  maxLength={13}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editData.taxid
                    ? `${editData.taxid.length}/13`
                    : "ต้องเป็น 13 หลัก"}
                </p>
              </div>
              <div>
                <Label>เลขที่ประจำตัวสังคม</Label>
                <Input
                  value={editData.social_security || ""}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 13);
                    setEditData({
                      ...editData,
                      social_security: value,
                    });
                  }}
                  className="mt-1"
                  placeholder="กรุณาป้อน 13 หลัก"
                  maxLength={13}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editData.social_security
                    ? `${editData.social_security.length}/13`
                    : "ต้องเป็น 13 หลัก"}
                </p>
              </div>
              <div className="col-span-2">
                <Label>วันที่เข้าทำงาน</Label>
                <Input
                  type="date"
                  value={
                    editData.startDate
                      ? new Date(editData.startDate).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    // Only allow past dates and today
                    if (selectedDate <= today) {
                      setEditData({
                        ...editData,
                        startDate: new Date(e.target.value).toISOString(),
                      });
                    }
                  }}
                  max={new Date().toISOString().split("T")[0]}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  เลือกได้เฉพาะวันในอดีต หรือ วันนี้เท่านั้น
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="default" onClick={handleSaveEdit}>
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
