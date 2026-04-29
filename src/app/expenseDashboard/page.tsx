"use client";
import React from "react";
import { ExpenseProvider } from "@/contexts/ExpenseContext";
import { ConfirmDialogProvider } from "@/components/providers/confirm-dialog-provider";
import ExpenseFilters from "@/components/expenseDashboard/ExpenseFilters";
import ExpenseStats from "@/components/expenseDashboard/ExpenseStats";
import ExpenseTable from "@/components/expenseDashboard/ExpenseTable";
import ExpensePagination from "@/components/expenseDashboard/ExpensePagination";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ExpenseDashboardPage = () => {
  return (
    <ConfirmDialogProvider>
      <ExpenseProvider>
        <div className="w-full min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 p-6 font-sans transition-colors duration-300">
          <ExpenseFilters />
          <ExpenseStats />
          <ExpenseTable />
          <ExpensePagination />
          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </ExpenseProvider>
    </ConfirmDialogProvider>
  );
};

export default ExpenseDashboardPage;
