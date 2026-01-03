"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface EmployeeDirectoryProps {
  employees: Employee[];
}

export function EmployeeDirectory({ employees }: EmployeeDirectoryProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
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
      startDate: emp.startDate,
      social_security: emp.social_security,
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
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          ตารางข้อมูลพนักงาน
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">ลำดับ</TableHead>
                <TableHead className="font-semibold">รหัสพนักงาน</TableHead>
                <TableHead className="font-semibold">ชื่อ</TableHead>
                <TableHead className="font-semibold">ตำแหน่ง</TableHead>
                <TableHead className="font-semibold text-right">
                  เงินเดือน
                </TableHead>
                <TableHead className="font-semibold">วันที่เข้าทำงาน</TableHead>
                <TableHead className="font-semibold text-center">
                  การกระทำ
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp, idx) => (
                <TableRow
                  key={emp.id}
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleViewDetails(emp)}
                >
                  <TableCell className="text-center">{idx + 1}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {emp.code}
                  </TableCell>
                  <TableCell className="font-semibold">{emp.name}</TableCell>
                  <TableCell>{emp.position}</TableCell>
                  <TableCell className="text-right font-mono">
                    {emp.currentSalary?.toLocaleString("th-TH", {
                      style: "currency",
                      currency: "THB",
                    })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(emp.startDate).toLocaleDateString("th-TH")}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(emp);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        แก้ไข
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

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
                <p className="font-semibold">{selectedEmployee.position}</p>
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
                  {selectedEmployee.social_security}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">วันที่เข้าทำงาน</p>
                <p className="font-semibold">
                  {new Date(selectedEmployee.startDate).toLocaleDateString(
                    "th-TH"
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
                        ? POSITION_ROLES[editData.position as PositionRole]
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
              </div>
              <div>
                <Label>ธนาคาร</Label>
                <Input
                  value={editData.bankName || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, bankName: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>เลขบัญชี</Label>
                <Input
                  value={editData.bankAccount || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, bankAccount: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label>เลขประจำตัวผู้เสียภาษี</Label>
                <Input
                  value={editData.social_security || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      social_security: e.target.value,
                    })
                  }
                  className="mt-1"
                  placeholder="เช่น 1234567890123"
                />
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
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      startDate: new Date(e.target.value).toISOString(),
                    })
                  }
                  className="mt-1"
                />
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
    </Card>
  );
}
