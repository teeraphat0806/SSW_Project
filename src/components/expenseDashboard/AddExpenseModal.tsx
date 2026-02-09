"use client";
import React, { useState, useEffect } from "react";
import { X, DollarSign, FileText, Calendar, Plus } from "lucide-react";
import { useExpenseContext, ExpenseCategory } from "@/contexts/ExpenseContext";
import { toast } from "react-toastify";
import ExpenseCategoryModal from "./ExpenseCategoryModal";

type AddExpenseModalProps = {
  open: boolean;
  onClose: () => void;
};

const AddExpenseModal = ({ open, onClose }: AddExpenseModalProps) => {
  const { categories, refreshExpenses } = useExpenseContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    expenseDate: new Date().toISOString().split("T")[0],
    categoryId: "",
    receiptUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate
      if (!formData.description || !formData.amount || !formData.categoryId) {
        toast.error("กรุณากรอกข้อมูลให้ครบถ้วน", { position: "bottom-right" });
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: formData.description,
          amount: parseFloat(formData.amount),
          expenseDate: formData.expenseDate,
          categoryId: parseInt(formData.categoryId),
          receiptUrl: formData.receiptUrl || null,
        }),
      });

      if (response.ok) {
        toast.success("เพิ่มค่าใช้จ่ายสำเร็จ", { position: "bottom-right" });
        refreshExpenses();
        handleClose();
      } else {
        const error = await response.json();
        toast.error(error.error || "เพิ่มค่าใช้จ่ายไม่สำเร็จ", {
          position: "bottom-right",
        });
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", {
        position: "bottom-right",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      description: "",
      amount: "",
      expenseDate: new Date().toISOString().split("T")[0],
      categoryId: "",
      receiptUrl: "",
    });
    onClose();
  };

  const handleCategoryAdded = () => {
    // Categories will be auto-refreshed via context
    setShowCategoryModal(false);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-zinc-100">
              เพิ่มค่าใช้จ่ายใหม่
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* รายละเอียด */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-zinc-300">
                <FileText className="w-4 h-4 inline mr-1" />
                รายละเอียด
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                placeholder="ระบุรายละเอียดค่าใช้จ่าย..."
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-zinc-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors text-sm"
                required
              />
            </div>

            {/* ยอดเงิน */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-zinc-300">
                <DollarSign className="w-4 h-4 inline mr-1" />
                ยอดเงิน (บาท)
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-zinc-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors text-sm"
                required
              />
            </div>

            {/* วันที่ */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-zinc-300">
                <Calendar className="w-4 h-4 inline mr-1" />
                วันที่
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                value={formData.expenseDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) =>
                  setFormData({ ...formData, expenseDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-zinc-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors text-sm"
                required
              />
            </div>

            {/* ประเภทค่าใช้จ่าย */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-zinc-300">
                ประเภทค่าใช้จ่าย
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-zinc-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors text-sm"
                  required
                >
                  <option value="">เลือกประเภท</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
                  title="จัดการประเภทค่าใช้จ่าย"
                >
                  <Plus className="w-4 h-4" />
                  จัดการประเภท
                </button>
              </div>
            </div>

            {/* URL ใบเสร็จ (ไม่บังคับ) */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-zinc-300">
                URL ใบเสร็จ (ไม่บังคับ)
              </label>
              <input
                type="url"
                value={formData.receiptUrl}
                onChange={(e) =>
                  setFormData({ ...formData, receiptUrl: e.target.value })
                }
                placeholder="https://example.com/receipt.pdf"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-zinc-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors text-sm"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
                disabled={isSubmitting}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Category Management Modal */}
      <ExpenseCategoryModal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategoryChange={handleCategoryAdded}
      />
    </>
  );
};

export default AddExpenseModal;
