"use client";
import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, AlertCircle, Loader2, FileText } from "lucide-react";
import { useExpenseContext, ExpenseCategory } from "@/contexts/ExpenseContext";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import { toast } from "react-toastify";

type ExpenseCategoryModalProps = {
  open: boolean;
  onClose: () => void;
  onCategoryChange?: () => void;
};

const ExpenseCategoryModal = ({
  open,
  onClose,
  onCategoryChange,
}: ExpenseCategoryModalProps) => {
  const { categories, refreshExpenses } = useExpenseContext();
  const confirm = useConfirm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localCategories, setLocalCategories] = useState<
    (ExpenseCategory & { _count?: { expenses: number } })[]
  >([]);

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });

  // Fetch categories with count
  const fetchCategoriesWithCount = async () => {
    try {
      const response = await fetch("/api/expenseCategories");
      if (response.ok) {
        const data = await response.json();
        setLocalCategories(data.expenseCategories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCategoriesWithCount();
    }
  }, [open]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log("📝 Form submitted:", newCategory);

      if (!newCategory.name || !newCategory.description) {
        console.log("❌ Validation failed: missing name or description");
        toast.error("กรุณากรอกข้อมูลให้ครบถ้วน", { position: "bottom-right" });
        setIsSubmitting(false);
        return;
      }

      const requestBody = {
        name: newCategory.name,
        description: newCategory.description,
      };
      console.log("📤 Sending POST request:", requestBody);

      const response = await fetch("/api/expenseCategories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📥 Response status:", response.status);
      const responseData = await response.json();
      console.log("📥 Response data:", responseData);

      if (response.ok) {
        console.log("✅ Category added successfully!");
        toast.success("✅ เพิ่มประเภทค่าใช้จ่ายสำเร็จ", {
          position: "bottom-right",
        });
        setNewCategory({ name: "", description: "" });
        await fetchCategoriesWithCount();
        refreshExpenses();
        window.location.reload();
        if (onCategoryChange) onCategoryChange();
      } else {
        console.log("❌ Failed to add category:", responseData);
        toast.error(`❌ ${responseData.error || "เพิ่มประเภทไม่สำเร็จ"}`, {
          position: "bottom-right",
        });
      }
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", {
        position: "bottom-right",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (
    category: ExpenseCategory & { _count?: { expenses: number } },
  ) => {
    const expenseCount = category._count?.expenses || 0;

    // ตรวจสอบว่ามีการใช้งานหรือไม่
    if (expenseCount > 0) {
      toast.error(
        `❌ ไม่สามารถลบประเภท "${category.name}" ได้\n\nเนื่องจากมีค่าใช้จ่าย ${expenseCount} รายการที่ใช้ประเภทนี้อยู่\n\nกรุณาลบข้อมูลในตาราง expense ก่อน หรือเปลี่ยนประเภทของรายการเหล่านั้น`,
        {
          position: "bottom-right",
          autoClose: 5000,
        },
      );
      return;
    }

    const isConfirmed = await confirm({
      title: "⚠️ ยืนยันการลบประเภทค่าใช้จ่าย",
      description: `คุณต้องการลบประเภท "${category.name}" ใช่หรือไม่?\n\nการลบจะไม่สามารถกู้คืนได้`,
      variant: "destructive",
      confirmText: "ลบ",
      cancelText: "ยกเลิก",
    });

    if (!isConfirmed) return;

    try {
      console.log(
        `🗑️ Deleting category: ${category.name} (ID: ${category.id})`,
      );

      const response = await fetch(`/api/expenseCategories/${category.id}`, {
        method: "DELETE",
      });

      console.log("📥 Delete response status:", response.status);
      const responseData = await response.json();
      console.log("📥 Delete response data:", responseData);

      if (response.ok) {
        console.log("Category deleted successfully!");
        toast.success(`ลบประเภท "${category.name}" สำเร็จ`, {
          position: "bottom-right",
        });
        await fetchCategoriesWithCount();
        refreshExpenses();
        if (onCategoryChange) onCategoryChange();
      } else {
        console.log("❌ Failed to delete category:", responseData);
        // แสดง error message จาก API
        toast.error(`❌ ${responseData.error || "ลบประเภทไม่สำเร็จ"}`, {
          position: "bottom-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", {
        position: "bottom-right",
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-zinc-100">
            จัดการประเภทค่าใช้จ่าย
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add New Category Form */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-zinc-100">
              <Plus className="w-5 h-5 inline mr-2" />
              เพิ่มประเภทใหม่
            </h3>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">
                  ชื่อประเภท
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  placeholder="เช่น ค่าเดินทาง, ค่าอาหาร"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">
                  รายละเอียด
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      description: e.target.value,
                    })
                  }
                  placeholder="อธิบายประเภทค่าใช้จ่าย"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังเพิ่ม...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    เพิ่มประเภท
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Category List */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-zinc-100">
              <FileText className="w-5 h-5 inline mr-2" />
              รายการประเภททั้งหมด ({localCategories.length})
            </h3>
            {localCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>ยังไม่มีประเภทค่าใช้จ่าย</p>
              </div>
            ) : (
              <div className="space-y-2">
                {localCategories.map((category) => {
                  const expenseCount = category._count?.expenses || 0;
                  const canDelete = expenseCount === 0;

                  return (
                    <div
                      key={category.id}
                      className={`flex items-start justify-between p-4 rounded-lg border transition ${
                        !canDelete
                          ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50"
                          : "bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-800 dark:text-zinc-100">
                            {category.name}
                          </h4>
                          {!canDelete && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              ลบไม่ได้
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {category.description}
                        </p>
                        {category._count && (
                          <div className="mt-2">
                            {expenseCount > 0 ? (
                              <div className="flex items-center gap-1 text-xs">
                                <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                <span className="text-red-600 dark:text-red-400 font-medium">
                                  มีค่าใช้จ่าย {expenseCount}{" "}
                                  รายการที่ใช้ประเภทนี้
                                  (ต้องลบข้อมูลในตารางก่อน)
                                </span>
                              </div>
                            ) : (
                              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                ไม่มีการใช้งาน - สามารถลบได้
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className={`p-2 rounded-lg transition ml-3 ${
                          !canDelete
                            ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                            : "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 hover:scale-110"
                        }`}
                        title={
                          !canDelete
                            ? `ไม่สามารถลบได้ - มีค่าใช้จ่าย ${expenseCount} รายการที่ใช้ประเภทนี้\nต้องลบข้อมูลในตาราง expense ก่อน`
                            : "ลบประเภทนี้"
                        }
                        disabled={!canDelete}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="w-full px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCategoryModal;
