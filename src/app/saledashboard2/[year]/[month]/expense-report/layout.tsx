// src/app/layout.tsx
import Layout from "@/components/Layout";

import { ThemeProvider } from "next-themes";
export const metadata = {
  title: "Expense Report",
  description: "Expense Report Description",
};

export default function ExpenseReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <div className="bg-muted min-h-screen md:pl-20">{children}</div>
    </Layout>
  );
}
