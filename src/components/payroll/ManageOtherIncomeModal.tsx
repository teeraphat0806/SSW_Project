"use client";
import { useState } from "react";
import { Plus, Edit3 } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../ui/select";
import { DeleteOtherIncomeButton } from "./DeleteOtherIncomeButton";
import type { OtherIncomeType } from "../../lib/payroll-utils";

interface ManageOtherIncomeModalProps {
  types: OtherIncomeType[];
  onAdd: (name: string, defaultAmount?: number) => void;
  onUpdate: (id: string, name: string, defaultAmount?: number) => void;
  onRemove: (id: string) => void;
}

export function ManageOtherIncomeModal({
  types,
  onAdd,
  onUpdate,
  onRemove,
}: ManageOtherIncomeModalProps) {
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState<string>("");
  const [editing, setEditing] = useState<
    Record<string, { name: string; defaultAmount?: number }>
  >({});
  const [valueTypeStaffIncome, setValueTypeStaffIncome] = useState("");

  const canAdd =
    newName.trim() !== "" && // มีชื่อ
    newAmount !== "" && // มีจำนวน
    (valueTypeStaffIncome === "increase" ||
      valueTypeStaffIncome === "decrease"); // เลือกประเภทแล้ว

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>จัดการรายการรายได้อื่น</DialogTitle>
      </DialogHeader>

      <div className="space-y-3">
        {/* Add */}
        <div className="flex gap-2">
          <Input
            placeholder="ชื่อรายการ เช่น OT"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            placeholder="จำนวนเริ่มต้น (ไม่บังคับ)"
            type="number"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
          />
          <Select
            value={valueTypeStaffIncome}
            onValueChange={(v: "increase" | "decrease") =>
              setValueTypeStaffIncome(v)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกประเภท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="increase">เพิ่มรายได้</SelectItem>
              <SelectItem value="decrease">ลดรายได้</SelectItem>
            </SelectContent>
          </Select>
          <div></div>
          <Button
            disabled={!canAdd}
            onClick={() => {
              if (!canAdd) return;
              onAdd(newName, Number(newAmount));
              setNewName("");
              setNewAmount("");
              setValueTypeStaffIncome("");
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            เพิ่ม
          </Button>
        </div>

        <Separator />

        {/* List */}
        <ScrollArea className="h-80 rounded-md border">
          <div className="p-2 space-y-2">
            {types.length === 0 && (
              <p className="text-sm text-muted-foreground">ยังไม่มีรายการ</p>
            )}
            {types.map((t) => {
              const isEditing = !!editing[t.id];
              const val = editing[t.id] ?? {
                name: t.name,
                defaultAmount: t.defaultAmount,
              };
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-2 border rounded-lg p-2 bg-background"
                >
                  {isEditing ? (
                    <>
                      <Input
                        className="flex-1"
                        value={val.name}
                        onChange={(e) =>
                          setEditing((prev) => ({
                            ...prev,
                            [t.id]: { ...val, name: e.target.value },
                          }))
                        }
                      />
                      <Input
                        className="w-40"
                        type="number"
                        value={val.defaultAmount ?? ""}
                        onChange={(e) =>
                          setEditing((prev) => ({
                            ...prev,
                            [t.id]: {
                              ...val,
                              defaultAmount:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            },
                          }))
                        }
                      />
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const nameOk = val.name.trim() !== "";
                          const amtOk =
                            typeof val.defaultAmount === "number" &&
                            !Number.isNaN(val.defaultAmount);
                          if (!nameOk || !amtOk) return;

                          onUpdate(t.id, val.name.trim(), val.defaultAmount);
                          setEditing((prev) => {
                            const cp = { ...prev };
                            delete cp[t.id];
                            return cp;
                          });
                        }}
                      >
                        บันทึก
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="font-medium">{t.name}</div>
                        {t.defaultAmount !== undefined &&
                          !isNaN(Number(t.defaultAmount)) && (
                            <div className="text-xs text-muted-foreground">
                              ค่าเริ่มต้น: ฿
                              {Number(t.defaultAmount).toLocaleString()}
                            </div>
                          )}
                      </div>
                      <Button
                        className="hover:text-blue-600 cursor-pointer hover:scale-110 transition-all"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setEditing((prev) => ({
                            ...prev,
                            [t.id]: {
                              name: t.name,
                              defaultAmount: t.defaultAmount,
                            },
                          }))
                        }
                      >
                        <Edit3 className="h-4 w-4 " />
                      </Button>
                      <DeleteOtherIncomeButton
                        onConfirm={() => onRemove(t.id)}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <DialogFooter>
        <DialogTrigger asChild>
          <Button variant="secondary">ปิด</Button>
        </DialogTrigger>
      </DialogFooter>
    </DialogContent>
  );
}
