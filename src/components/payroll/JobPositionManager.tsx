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
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface JobPosition {
  id: number;
  name: string;
  baseSalary: number;
  _count?: {
    staff: number;
  };
}

export function JobPositionManager() {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<JobPosition | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    baseSalary: 0,
  });

  // Fetch positions
  const fetchPositions = async () => {
    try {
      const response = await fetch("/api/jobPosition", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPositions(data);
      }
    } catch (error) {
      console.error("Error fetching positions:", error);
      toast.error("ไม่สามารถโหลดข้อมูลตำแหน่งได้");
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  // Open add dialog
  const handleAdd = () => {
    setIsEdit(false);
    setCurrentPosition(null);
    setFormData({ name: "", baseSalary: 0 });
    setIsOpen(true);
  };

  // Open edit dialog
  const handleEdit = (position: JobPosition) => {
    setIsEdit(true);
    setCurrentPosition(position);
    setFormData({
      name: position.name,
      baseSalary: position.baseSalary,
    });
    setIsOpen(true);
  };

  // Save (Create or Update)
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("กรุณาระบุชื่อตำแหน่ง");
      return;
    }
    if (formData.baseSalary <= 0) {
      toast.error("กรุณาระบุเงินเดือนเริ่มต้น");
      return;
    }

    try {
      const url = isEdit
        ? `/api/jobPosition/${currentPosition?.id}`
        : "/api/jobPosition";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(isEdit ? "แก้ไขตำแหน่งสำเร็จ" : "เพิ่มตำแหน่งสำเร็จ");
        setIsOpen(false);
        fetchPositions();
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error saving position:", error);
      toast.error("ไม่สามารถบันทึกข้อมูลได้");
    }
  };

  // Delete
  const handleDelete = async (position: JobPosition) => {
    if (position._count && position._count.staff > 0) {
      toast.error(
        `ไม่สามารถลบได้ เนื่องจากมีพนักงาน ${position._count.staff} คนใช้ตำแหน่งนี้อยู่`,
      );
      return;
    }

    if (!confirm(`คุณต้องการลบตำแหน่ง "${position.name}" ใช่หรือไม่?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/jobPosition/${position.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("ลบตำแหน่งสำเร็จ");
        fetchPositions();
      } else {
        const data = await response.json();
        toast.error(data.error || "ไม่สามารถลบตำแหน่งได้");
      }
    } catch (error) {
      console.error("Error deleting position:", error);
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
          จัดการตำแหน่งงาน
        </h2>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          เพิ่มตำแหน่ง
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-700">
              <th className="py-3 px-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                ลำดับ
              </th>
              <th className="py-3 px-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                ชื่อตำแหน่ง
              </th>
              <th className="py-3 px-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase text-right">
                เงินเดือนเริ่มต้น
              </th>
              <th className="py-3 px-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase text-center">
                จำนวนพนักงาน
              </th>
              <th className="py-3 px-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase text-center">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {positions.map((position, idx) => (
              <tr
                key={position.id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <td className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-200">
                  {idx + 1}
                </td>
                <td className="py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-white">
                  {position.name}
                </td>
                <td className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-200 text-right font-mono">
                  {position.baseSalary.toLocaleString("th-TH", {
                    style: "currency",
                    currency: "THB",
                  })}
                </td>
                <td className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-200 text-center">
                  {position._count?.staff || 0} คน
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(position)}
                      className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      title="แก้ไข"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(position)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      title="ลบ"
                      disabled={position._count && position._count.staff > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "แก้ไขตำแหน่ง" : "เพิ่มตำแหน่งใหม่"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">ชื่อตำแหน่ง</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="เช่น พนักงานทั่วไป"
              />
            </div>

            <div>
              <Label htmlFor="baseSalary">เงินเดือนเริ่มต้น (บาท)</Label>
              <Input
                id="baseSalary"
                type="number"
                value={formData.baseSalary}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    baseSalary: Number(e.target.value),
                  })
                }
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave}>{isEdit ? "บันทึก" : "เพิ่ม"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
