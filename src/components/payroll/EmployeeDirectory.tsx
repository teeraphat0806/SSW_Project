"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Edit, Settings, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { Employee } from "@/types/payroll";
import { ToastContainer, toast } from "react-toastify";

// // Position mapping with Thai translations
// const POSITION_ROLES = {
//   superadmin: "ผู้จัดการระบบ",
//   supervisor: "หัวหน้างาน",
//   clerk: "เจ้าหน้าที่",
//   cutter: "ช่างตัด",
//   delivery: "ผู้จัดส่ง",
// } as const;

// type PositionRole = keyof typeof POSITION_ROLES;
interface JobPosition {
  id: number;
  name: string;
  baseSalary: number;
}

type UpdatedEmployee = Employee & {
  jobPosition?: JobPosition;
};
const THAI_BANKS = [
  { code: "BBL", name: "ธนาคารกรุงเทพ" },
  { code: "KBANK", name: "ธนาคารกสิกรไทย" },
  { code: "KTB", name: "ธนาคารกรุงไทย" },
  { code: "SCB", name: "ธนาคารไทยพาณิชย์" },
  { code: "BAY", name: "ธนาคารกรุงศรีอยุธยา" },
  { code: "TTB", name: "ธนาคารทหารไทยธนชาต" },
  { code: "UOB", name: "ธนาคารยูโอบี" },
  { code: "CIMBT", name: "ธนาคารซีไอเอ็มบี ไทย" },
  { code: "TISCO", name: "ธนาคารทิสโก้" },
  { code: "KKP", name: "ธนาคารเกียรตินาคินภัทร" },
  { code: "LHBANK", name: "ธนาคารแลนด์ แอนด์ เฮ้าส์" },
  { code: "ICBC", name: "ธนาคารไอซีบีซี (ไทย)" },
  { code: "TCD", name: "ธนาคารไทยเครดิต" },

  { code: "GSB", name: "ธนาคารออมสิน" },
  { code: "BAAC", name: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)" },
  { code: "GHB", name: "ธนาคารอาคารสงเคราะห์" },
  { code: "ISBT", name: "ธนาคารอิสลามแห่งประเทศไทย" },
  { code: "EXIM", name: "ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย" },
  { code: "SME", name: "ธนาคารพัฒนาวิสาหกิจขนาดกลางและขนาดย่อมแห่งประเทศไทย" },

  { code: "CITI", name: "ธนาคารซิตี้แบงก์" },
  { code: "HSBC", name: "ธนาคารเอชเอสบีซี" },
  { code: "SMBC", name: "ธนาคารซูมิโตโม มิตซุย แบงกิ้ง คอร์ปอเรชั่น" },
  { code: "MIZUHO", name: "ธนาคารมิซูโฮ" },
  { code: "MUFG", name: "ธนาคารมูฟจิ (ธนาคารแห่งโตเกียว-มิตซูบิชิ ยูเอฟเจ)" },
  { code: "DB", name: "ธนาคารดอยซ์แบงก์" },
  { code: "BNPP", name: "ธนาคารบีเอ็นพี พารีบาส์" },
  { code: "BOA", name: "ธนาคารแห่งอเมริกา (Bank of America)" },
  { code: "ANZ", name: "ธนาคารออสเตรเลียและนิวซีแลนด์ (ANZ)" },
  { code: "OCBC", name: "ธนาคารโอซีบีซี" },
  { code: "DBS", name: "ธนาคารดีบีเอส" },
  { code: "MEGA", name: "ธนาคารเมกะ สากลพาณิชย์" },
  { code: "SHINHAN", name: "ธนาคารชินฮัน" },
  { code: "BOC", name: "ธนาคารแห่งประเทศจีน (ไทย)" },
  { code: "KDB", name: "ธนาคารเพื่อการพัฒนาแห่งเกาหลี (KDB)" },
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
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [isPositionManagerOpen, setIsPositionManagerOpen] = useState(false);
  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState<
    (JobPosition & { _count?: { staff: number } }) | null
  >(null);
  const [newPositionData, setNewPositionData] = useState({
    name: "",
    baseSalary: 0,
  });

  // Fetch job positions
  useEffect(() => {
    const fetchJobPositions = async () => {
      try {
        const response = await fetch("/api/staff/position", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setJobPositions(data);
        }
      } catch (error) {
        console.error("Error fetching job positions:", error);
      }
    };
    fetchJobPositions();
  }, []);

  const handleAddPosition = async () => {
    if (!newPositionData.name.trim()) {
      toast.error("กรุณาระบุชื่อตำแหน่ง");
      return;
    }
    if (newPositionData.baseSalary <= 0) {
      toast.error("กรุณาระบุเงินเดือนเริ่มต้นที่มากกว่า 0");
      return;
    }

    try {
      const response = await fetch("/api/staff/position", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newPositionData),
      });

      if (response.ok) {
        toast.success("เพิ่มตำแหน่งสำเร็จ");
        setIsAddPositionOpen(false);
        setNewPositionData({ name: "", baseSalary: 0 });
        const data = await response.json();
        setJobPositions([...jobPositions, data]);
      } else {
        const data = await response.json();
        toast.error(data.error || "ไม่สามารถเพิ่มตำแหน่งได้");
      }
    } catch (error) {
      console.error("Error adding position:", error);
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleDeletePosition = async (
    position: JobPosition & { _count?: { staff: number } },
  ) => {
    if (position._count && position._count.staff > 0) {
      toast.error(
        `ไม่สามารถลบได้ เนื่องจากมีพนักงาน ${position._count.staff} คนใช้ตำแหน่งนี้อยู่`,
      );
      return;
    }

    // Open confirmation dialog
    setPositionToDelete(position);
  };

  const confirmDeletePosition = async () => {
    if (!positionToDelete) return;

    try {
      const response = await fetch(
        `/api/staff/position/${positionToDelete.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (response.ok) {
        toast.success("ลบตำแหน่งสำเร็จ");
        setJobPositions(
          jobPositions.filter((p) => p.id !== positionToDelete.id),
        );
      } else {
        const data = await response.json();
        toast.error(data.error || "ไม่สามารถลบตำแหน่งได้");
      }
    } catch (error) {
      console.error("Error deleting position:", error);
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setPositionToDelete(null);
    }
  };

  const handleViewDetails = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsDetailsOpen(true);
  };

  const handleEditClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEditData({
      name: emp.name,
      jobPosition: emp.jobPosition,
      bankName: emp.bankName,
      bankAccount: emp.bankAccount,
      taxid: emp.taxid,
      social_security: emp.social_security,
      startDate: emp.startDate,
      hireStatus: emp.hireStatus,
      TerminationDate: emp.TerminationDate,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEmployee) return;

    try {
      // Transform editData to match API schema (StaffSchema)
      const updateData: any = {};
      const isTerminating =
        editData.hireStatus === false && selectedEmployee.hireStatus === true;

      // Only include fields that exist in StaffSchema
      if (editData.bankName) updateData.bankName = editData.bankName;
      if (editData.bankAccount) updateData.bankAccount = editData.bankAccount;
      if (editData.taxid) updateData.taxid = editData.taxid;
      if (editData.social_security)
        updateData.social_security = editData.social_security;

      // Convert jobPosition object to positionId
      if (editData.jobPosition?.id) {
        updateData.positionId = editData.jobPosition.id;
      }
      if (
        editData.hireStatus !== undefined &&
        editData.hireStatus !== selectedEmployee.hireStatus
      ) {
        updateData.hireStatus = editData.hireStatus;
        if (!editData.hireStatus) {
          updateData.TerminationDate = new Date().toISOString();
        } else if (!selectedEmployee.hireStatus && editData.hireStatus) {
          // Rehire: reset start date to today and clear termination date
          updateData.startDate = new Date().toISOString();
          updateData.TerminationDate = null;
        }
      }
      if (isTerminating) {
        const employmentResponse = await fetch("/api/staffEmployment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            staffId: selectedEmployee.id,
            endDate: updateData.TerminationDate || new Date().toISOString(),
          }),
        });

        if (!employmentResponse.ok) {
          const data = await employmentResponse
            .json()
            .catch(() => ({ error: "Failed to create employment history" }));
          toast.error(data.error || "ไม่สามารถบันทึกประวัติการเลิกจ้างได้");
          return;
        }
      }
      const response = await fetch(`/api/staff/${selectedEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast.success("อัพเดทข้อมูลพนักงานสำเร็จ");
        setIsEditOpen(false);
        window.location.reload();
      } else {
        const data = await response.json();
        toast.error(data.error || "ไม่สามารถอัพเดทข้อมูลได้");
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("เกิดข้อผิดพลาดในการอัพเดทข้อมูล");
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
                    {emp.jobPosition?.name || "-"}
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
                    {(() => {
                      const date = new Date(emp.startDate);
                      const day = date.getDate();
                      const month = date.toLocaleDateString("th-TH", {
                        month: "long",
                      });
                      const year = date.getFullYear() + 543;
                      return `${day} ${month} ${year}`;
                    })()}
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
                  {selectedEmployee.jobPosition?.name || "-"}
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
                  {(() => {
                    const date = new Date(selectedEmployee.startDate);
                    const day = date.getDate();
                    const month = date.toLocaleDateString("th-TH", {
                      month: "long",
                    });
                    const year = date.getFullYear() + 543;
                    return `${day} ${month} พ.ศ. ${year}`;
                  })()}
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
                <div className="flex items-center justify-between mb-1">
                  <Label>ตำแหน่ง</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPositionManagerOpen(true)}
                    className="h-8 px-2"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    จัดการตำแหน่ง
                  </Button>
                </div>
                <Select
                  value={editData.jobPosition?.id?.toString()} // ✅ เปลี่ยนจาก position
                  onValueChange={(value) =>
                    setEditData({
                      ...editData,
                      jobPosition: jobPositions.find(
                        (p) => p.id === Number(value),
                      ),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue>
                      {editData.jobPosition?.id
                        ? jobPositions.find(
                            (p) => p.id === editData.jobPosition?.id,
                          )?.name // ✅ เปลี่ยน
                        : "เลือกตำแหน่ง"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {jobPositions.map(
                      (
                        position, // ✅ เปลี่ยนจาก POSITION_ROLES
                      ) => (
                        <SelectItem
                          key={position.id}
                          value={position.id.toString()}
                        >
                          {position.name} (
                          {position.baseSalary.toLocaleString()} บาท)
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
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
              <div className="">
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
              <div>
                <Label>สถานะการจ้างงาน</Label>
                <Select
                  value={editData.hireStatus === true ? "active" : "inactive"}
                  onValueChange={(value) => {
                    const isActive = value === "active";
                    setEditData({
                      ...editData,
                      hireStatus: isActive,
                      TerminationDate: isActive
                        ? undefined
                        : editData.TerminationDate,
                    });
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">กำลังจ้างงาน</SelectItem>
                    <SelectItem value="inactive">เลิกจ้างงาน</SelectItem>
                  </SelectContent>
                </Select>
                {(editData.TerminationDate ||
                  selectedEmployee?.TerminationDate) &&
                  !editData.hireStatus && (
                    <p className="text-xs text-muted-foreground mt-1">
                      วันที่เลิกจ้างงาน:{" "}
                      {new Date(
                        editData.TerminationDate ||
                          selectedEmployee?.TerminationDate!,
                      ).toLocaleDateString("th-TH")}
                    </p>
                  )}
                {editData.hireStatus === true && editData.TerminationDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    วันที่เคยเลิกจ้างงาน:{" "}
                    {new Date(editData.TerminationDate).toLocaleDateString(
                      "th-TH",
                    )}
                  </p>
                )}
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

      {/* Position Manager Dialog */}
      <Dialog
        open={isPositionManagerOpen}
        onOpenChange={setIsPositionManagerOpen}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>จัดการตำแหน่งพนักงาน</span>
              <Button
                size="sm"
                onClick={() => setIsAddPositionOpen(true)}
                className="ml-auto"
              >
                <Plus className="h-4 w-4 mr-1" />
                เพิ่มตำแหน่งใหม่
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {jobPositions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                ไม่มีตำแหน่งในระบบ
              </p>
            ) : (
              <div className="space-y-2">
                {jobPositions.map((position) => (
                  <div
                    key={position.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{position.name}</p>
                      <p className="text-sm text-muted-foreground">
                        เงินเดือนเริ่มต้น:{" "}
                        {position.baseSalary.toLocaleString("th-TH", {
                          style: "currency",
                          currency: "THB",
                        })}
                      </p>
                      {(position as any)._count && (
                        <p className="text-xs text-muted-foreground mt-1">
                          มีพนักงาน {(position as any)._count.staff} คน
                        </p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletePosition(position as any)}
                      disabled={
                        (position as any)._count &&
                        (position as any)._count.staff > 0
                      }
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      ลบ
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPositionManagerOpen(false)}
            >
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Position Dialog */}
      <Dialog open={isAddPositionOpen} onOpenChange={setIsAddPositionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มตำแหน่งใหม่</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>ชื่อตำแหน่ง</Label>
              <Input
                value={newPositionData.name}
                onChange={(e) =>
                  setNewPositionData({
                    ...newPositionData,
                    name: e.target.value,
                  })
                }
                placeholder="เช่น ผู้จัดการ, พนักงานขาย"
                className="mt-1"
              />
            </div>
            <div>
              <Label>เงินเดือนเริ่มต้น (บาท)</Label>
              <Input
                type="number"
                value={newPositionData.baseSalary || ""}
                onChange={(e) =>
                  setNewPositionData({
                    ...newPositionData,
                    baseSalary: Number(e.target.value),
                  })
                }
                placeholder="0"
                className="mt-1"
                min="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddPositionOpen(false);
                setNewPositionData({ name: "", baseSalary: 0 });
              }}
            >
              ยกเลิก
            </Button>
            <Button variant="default" onClick={handleAddPosition}>
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!positionToDelete}
        onOpenChange={(open) => !open && setPositionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบตำแหน่ง</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบตำแหน่ง{" "}
              <span className="font-semibold text-foreground">
                "{positionToDelete?.name}"
              </span>{" "}
              ใช่หรือไม่?
              <br />
              <span className="text-destructive font-medium mt-2 block">
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePosition}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบตำแหน่ง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ToastContainer />
    </div>
  );
}
