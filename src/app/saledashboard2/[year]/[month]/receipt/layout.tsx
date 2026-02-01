// src/app/layout.tsx
import Layout from "@/components/Layout";

import { ThemeProvider } from "next-themes";
export const metadata = {
  title: "Receipt",
  description: "Receipt Description",
};

export default function ReceiptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <div className="bg-muted min-h-screen pl-0 md:pl-20">{children}</div>
    </Layout>
  );
}
