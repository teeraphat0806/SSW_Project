"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export type ExpenseCategory = {
  id: number;
  name: string;
  description: string;
};

export type ExpenseItem = {
  id: number;
  description: string;
  amount: number;
  expenseDate: string;
  categoryId: number;
  receiptUrl?: string | null;
  category: ExpenseCategory;
  staff?: {
    id: number;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginationInfo = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

type ExpenseContextType = {
  // Data
  expenses: ExpenseItem[];
  categories: ExpenseCategory[];
  pagination: PaginationInfo;
  isLoading: boolean;
  error: string | null;

  // Filters
  startDate: string;
  endDate: string;
  selectedCategory: string;
  sortBy: string;
  showFilters: boolean;

  // Actions
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setSelectedCategory: (category: string) => void;
  setSortBy: (sortBy: string) => void;
  setShowFilters: (show: boolean) => void;
  setPagination: React.Dispatch<React.SetStateAction<PaginationInfo>>;
  handlePageChange: (page: number) => void;
  handleResetFilters: () => void;
  refreshExpenses: () => void;
  deleteExpense: (id: number) => Promise<boolean>;
};

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const useExpenseContext = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error("useExpenseContext must be used within ExpenseProvider");
  }
  return context;
};

type ExpenseProviderProps = {
  children: ReactNode;
};

export const ExpenseProvider = ({ children }: ExpenseProviderProps) => {
  // State จัดการข้อมูล
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });

  // Filter state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [showFilters, setShowFilters] = useState(true);

  // ฟังก์ชันดึงข้อมูลหมวดหมู่
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/expenseCategories");
      if (!response.ok) throw new Error("Failed to fetch categories");

      const data = await response.json();
      setCategories(data.expenseCategories || []);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  // ฟังก์ชันดึงข้อมูลค่าใช้จ่ายจาก API
  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortBy,
      });

      if (startDate) {
        params.append("startDate", startDate);
      }

      if (endDate) {
        params.append("endDate", endDate);
      }

      if (selectedCategory) {
        params.append("categoryId", selectedCategory);
      }

      const response = await fetch(`/api/expense?${params.toString()}`);

      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();
      setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    sortBy,
    startDate,
    endDate,
    selectedCategory,
  ]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch expenses when dependencies change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchExpenses();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchExpenses]);

  // ฟังก์ชันเปลี่ยนหน้า
  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => {
      if (newPage >= 1 && newPage <= prev.totalPages) {
        return { ...prev, page: newPage };
      }
      return prev;
    });
  }, []);

  // ฟังก์ชันรีเซ็ตฟิลเตอร์
  const handleResetFilters = useCallback(() => {
    setStartDate("");
    setEndDate("");
    setSelectedCategory("");
    setSortBy("date_desc");
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // ฟังก์ชัน refresh ข้อมูล
  const refreshExpenses = useCallback(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // ฟังก์ชันลบข้อมูล
  const deleteExpense = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        console.log(`🔗 API Call: DELETE /api/expense/${id}`);

        const response = await fetch(`/api/expense/${id}`, {
          method: "DELETE",
        });

        console.log(`📥 API Response Status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          console.log("📥 API Response Data:", data);
          console.log("✅ Expense deleted, refreshing list...");
          fetchExpenses();
          return true;
        } else {
          const errorData = await response.json();
          console.log("❌ API Error Response:", errorData);
          return false;
        }
      } catch (error) {
        console.error("❌ Delete error (Network/Exception):", error);
        return false;
      }
    },
    [fetchExpenses],
  );

  const value: ExpenseContextType = {
    expenses,
    categories,
    pagination,
    isLoading,
    error,
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
    handlePageChange,
    handleResetFilters,
    refreshExpenses,
    deleteExpense,
  };

  return (
    <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
  );
};
