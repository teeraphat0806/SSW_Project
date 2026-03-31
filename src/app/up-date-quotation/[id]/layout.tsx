// src/app/up-date-quotation/[id]/layout.tsx
import "../../globals.css";
import Layout from "../../../components/Layout";
import { ToastContainer } from "react-toastify";
import { ConfirmDialogProvider } from "@/components/providers/confirm-dialog-provider";

export const metadata = {
  title: "แก้ไขใบเสนอราคา",
  description: "แก้ไขข้อมูลใบเสนอราคา",
};

export default function UpdateQuotationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <div className="bg-muted min-h-screen md:pl-20">
        <ConfirmDialogProvider>
          {children}
          <ToastContainer />
        </ConfirmDialogProvider>
      </div>
    </Layout>
  );
}
