"use client";
import React, { useState } from "react";
import {
  Calendar,
  DollarSign,
  ArrowUpDown,
  X,
  Filter,
  Plus,
} from "lucide-react";
import { useExpenseContext } from "@/contexts/ExpenseContext";
import AddExpenseModal from "./AddExpenseModal";

const ExpenseFilters = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const {
    categories,
    startDate,
    endDate,
    selectedCategory,
    sortBy,
    showFilters,
    setStartDate,
    setEndDate,
    setSelectedCategory,
    setSortBy,
    setShowFilters,
    setPagination,
    handleResetFilters,
  } = useExpenseContext();

  // กำหนดวันที่สูงสุด (วันนี้)
  const today = new Date().toISOString().split("T")[0];

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <>
      {/* Filter Toggle Button */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row lg:flex-row mt-12 md:mt-0 lg:mt-0 items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">รายการค่าใช้จ่าย</h1>
          <p className="text-md text-gray-500 dark:text-zinc-400">
            จัดการและติดตามค่าใช้จ่ายทั้งหมด
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
          >
            เพิ่มค่าใช้จ่าย
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${
              showFilters
                ? "bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
                : "bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-800"
            }`}
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900/60 p-4 rounded-xl shadow-sm mb-6 border border-gray-100 dark:border-zinc-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* วันที่เริ่มต้น */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-zinc-300">
                <Calendar className="w-4 h-4 inline mr-1" />
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                value={startDate}
                max={endDate || today}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-zinc-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors text-sm"
              />
            </div>

            {/* วันที่สิ้นสุด */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-zinc-300">
                <Calendar className="w-4 h-4 inline mr-1" />
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max={today}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-zinc-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors text-sm"
              />
            </div>

            {/* เลือกประเภท */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-zinc-300">
                <DollarSign className="w-4 h-4 inline mr-1" />
                ประเภทค่าใช้จ่าย
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-zinc-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors text-sm"
              >
                <option value="">ทั้งหมด</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* เรียงลำดับ */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-zinc-300">
                <ArrowUpDown className="w-4 h-4 inline mr-1" />
                เรียงลำดับ
              </label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-zinc-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors text-sm"
              >
                <option value="date_desc">วันที่: ล่าสุด → เก่าสุด</option>
                <option value="date_asc">วันที่: เก่าสุด → ล่าสุด</option>
                <option value="amount_desc">จำนวนเงิน: สูง → ต่ำ</option>
                <option value="amount_asc">จำนวนเงิน: ต่ำ → สูง</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-zinc-400">
              {(startDate || endDate || selectedCategory) && (
                <span>
                  กำลังกรองข้อมูล
                  {startDate &&
                    ` - จาก ${new Date(startDate).toLocaleDateString("th-TH")}`}
                  {endDate &&
                    ` ถึง ${new Date(endDate).toLocaleDateString("th-TH")}`}
                  {selectedCategory &&
                    ` - ${categories.find((c) => c.id.toString() === selectedCategory)?.name}`}
                </span>
              )}
            </div>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition"
            >
              <X className="w-4 h-4" />
              ล้างตัวกรอง
            </button>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <AddExpenseModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </>
  );
};

export default ExpenseFilters;
