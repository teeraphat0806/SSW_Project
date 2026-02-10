"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  DollarSign,
  FileText,
  Calendar,
  Plus,
  Upload,
  Edit2,
  Save,
  Image as ImageIcon,
  Download,
  Eye,
  ZoomIn,
} from "lucide-react";
import { useExpenseContext } from "@/contexts/ExpenseContext";
import { toast } from "react-toastify";
import ExpenseCategoryModal from "./ExpenseCategoryModal";

type Expense = {
  id: number;
  description: string;
  amount: number;
  expenseDate: string;
  categoryId: number;
  receiptUrl: string | null;
  category?: {
    id: number;
    name: string;
  };
};

type EditExpenseModalProps = {
  open: boolean;
  onClose: () => void;
  expense: Expense | null;
};

const EditExpenseModal = ({
  open,
  onClose,
  expense,
}: EditExpenseModalProps) => {
  const { categories, refreshExpenses } = useExpenseContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    expenseDate: "",
    categoryId: "",
    receiptUrl: "",
  });

  // โหลดข้อมูล expense เมื่อเปิด modal
  useEffect(() => {
    if (expense && open) {
      setFormData({
        description: expense.description || "",
        amount: expense.amount.toString(),
        expenseDate: new Date(expense.expenseDate).toISOString().split("T")[0],
        categoryId: expense.categoryId.toString(),
        receiptUrl: expense.receiptUrl || "",
      });
      setIsEditing(false);
      setReceiptFile(null);
    }
  }, [expense, open]);

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

      let receiptKey = formData.receiptUrl;

      // Upload new receipt image if selected
      if (receiptFile) {
        console.log("📤 Uploading new receipt image...");
        setUploadProgress(true);
        const uploadFormData = new FormData();
        uploadFormData.append("file", receiptFile);

        const uploadResponse = await fetch("/api/upload/expense", {
          method: "POST",
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          receiptKey = `/api/upload/expense/${uploadResult.key}`;
          console.log("✅ Image uploaded successfully. New key:", receiptKey);
        } else {
          console.log("❌ Image upload failed");
          toast.error("ไม่สามารถอัพโหลดรูปภาพได้", {
            position: "bottom-right",
          });
          setIsSubmitting(false);
          setUploadProgress(false);
          return;
        }
        setUploadProgress(false);
      }

      console.log("📤 Updating expense with data:", {
        description: formData.description,
        amount: parseFloat(formData.amount),
        expenseDate: new Date(formData.expenseDate),
        categoryId: parseInt(formData.categoryId),
        receiptUrl: receiptKey || null,
      });

      const response = await fetch(`/api/expense/${expense?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: formData.description,
          amount: parseFloat(formData.amount),
          expenseDate: new Date(formData.expenseDate),
          categoryId: parseInt(formData.categoryId),
          receiptUrl: receiptKey || null,
        }),
      });

      if (response.ok) {
        toast.success("แก้ไขค่าใช้จ่ายสำเร็จ", { position: "bottom-right" });
        refreshExpenses();
        handleClose();
      } else {
        const error = await response.json();
        toast.error(error.error || "แก้ไขค่าใช้จ่ายไม่สำเร็จ", {
          position: "bottom-right",
        });
      }
    } catch (error) {
      console.error("Error updating expense:", error);
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
      expenseDate: "",
      categoryId: "",
      receiptUrl: "",
    });
    setReceiptFile(null);
    setIsEditing(false);
    setShowImagePreview(false);
    onClose();
  };

  const handleDownloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `expense-receipt-${expense?.id || "unknown"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("ดาวน์โหลดรูปภาพสำเร็จ", { position: "bottom-right" });
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("ไม่สามารถดาวน์โหลดรูปภาพได้", { position: "bottom-right" });
    }
  };

  const handleCategoryAdded = () => {
    setShowCategoryModal(false);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  if (!open || !expense) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-zinc-100">
                {isEditing ? "แก้ไขค่าใช้จ่าย" : "รายละเอียดค่าใช้จ่าย"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                ID: {expense.id}
              </p>
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition"
                  title="แก้ไข"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          {isEditing ? (
            // Edit Mode
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

              {/* อัพโหลดรูปภาพใบเสร็จ (ไม่บังคับ) */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-zinc-300">
                  <Upload className="w-4 h-4 inline mr-1" />
                  อัพโหลดรูปภาพใบเสร็จใหม่ (ไม่บังคับ)
                </label>

                {/* แสดงรูปภาพปัจจุบัน */}
                {formData.receiptUrl && !receiptFile && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-zinc-950/60 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      รูปภาพปัจจุบัน:
                    </p>
                    <div className="relative inline-block">
                      <img
                        src={formData.receiptUrl}
                        alt="Receipt"
                        className="max-h-48 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition"
                        onClick={() => setShowImagePreview(true)}
                      />
                      <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity bg-black/50 rounded-lg p-1">
                        <ZoomIn className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowImagePreview(true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-xs font-medium"
                      >
                        <Eye className="w-3 h-3" />
                        ดูรูปเต็ม
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadImage(formData.receiptUrl)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-xs font-medium"
                      >
                        <Download className="w-3 h-3" />
                        ดาวน์โหลด
                      </button>
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setReceiptFile(file);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-zinc-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400"
                />
                {receiptFile && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    ไฟล์ใหม่ที่เลือก: {receiptFile.name}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {uploadProgress
                    ? "กำลังอัพโหลดรูปภาพ..."
                    : isSubmitting
                      ? "กำลังบันทึก..."
                      : "บันทึกการแก้ไข"}
                </button>
              </div>
            </form>
          ) : (
            // View Mode
            <div className="p-6 space-y-5">
              {/* รายละเอียด */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-500 dark:text-gray-400">
                  รายละเอียด
                </label>
                <p className="text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {expense.description || "-"}
                </p>
              </div>

              {/* ยอดเงิน */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-500 dark:text-gray-400">
                  ยอดเงิน
                </label>
                <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                  {formatNumber(expense.amount)} ฿
                </p>
              </div>

              {/* วันที่ */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-500 dark:text-gray-400">
                  วันที่
                </label>
                <p className="text-base text-gray-800 dark:text-gray-200">
                  {formatDate(expense.expenseDate)}
                </p>
              </div>

              {/* ประเภทค่าใช้จ่าย */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-500 dark:text-gray-400">
                  ประเภทค่าใช้จ่าย
                </label>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                  {expense.category?.name || "ไม่ระบุ"}
                </span>
              </div>

              {/* รูปภาพใบเสร็จ */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-500 dark:text-gray-400">
                  รูปภาพใบเสร็จ
                </label>
                {expense.receiptUrl ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <img
                        src={expense.receiptUrl}
                        alt="Receipt"
                        className="max-w-full max-h-64 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md cursor-pointer hover:opacity-90 transition"
                        onClick={() => setShowImagePreview(true)}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                            <div class="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              <span>ไม่สามารถโหลดรูปภาพได้</span>
                            </div>
                          `;
                          }
                        }}
                      />
                      <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity bg-black/50 rounded-lg p-1">
                        <ZoomIn className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowImagePreview(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        ดูรูปเต็ม
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadImage(expense.receiptUrl!)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        ดาวน์โหลด
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-zinc-950/60 text-gray-500 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700">
                    <ImageIcon className="w-5 h-5" />
                    <span>ไม่มีรูปภาพ</span>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
                >
                  ปิด
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Management Modal */}
      <ExpenseCategoryModal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategoryChange={handleCategoryAdded}
      />

      {/* Image Preview Modal */}
      {showImagePreview && expense?.receiptUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowImagePreview(false)}
        >
          <div className="relative max-w-7xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                รูปภาพใบเสร็จ - ID: {expense.id}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadImage(expense.receiptUrl!);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                >
                  <Download className="w-5 h-5" />
                  ดาวน์โหลด
                </button>
                <button
                  onClick={() => setShowImagePreview(false)}
                  className="p-2 hover:bg-white/10 text-white rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center overflow-auto">
              <img
                src={expense.receiptUrl}
                alt="Receipt Full Size"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Footer */}
            <div className="mt-4 text-center text-gray-400 text-sm">
              คลิกนอกรูปภาพเพื่อปิด
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditExpenseModal;
