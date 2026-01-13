// src/app/่job-order-detail/[id]/layout.tsx
import "../../globals.css";
import Layout from "../../../components/Layout";
import { ThemeProvider } from "next-themes";

import { ToastContainer } from "react-toastify";
import { ConfirmDialogProvider } from "@/components/providers/confirm-dialog-provider";
export const metadata = {
  title: "My App",
  description: "My App Description",
};

export default function JobOrderDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <div className="bg-muted min-h-screen md:pl-20 ">
        <ThemeProvider attribute="class">
          <ConfirmDialogProvider>
          {children}
          <ToastContainer />
          </ConfirmDialogProvider>
        </ThemeProvider>
      </div>
    </Layout>
  );
}
