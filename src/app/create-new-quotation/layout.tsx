// src/app/create-new-quotation/layout.tsx
import "../globals.css";
import Layout from "../../components/Layout";

import { ToastContainer } from "react-toastify";
import { ConfirmDialogProvider } from "@/components/providers/confirm-dialog-provider";
export const metadata = {
  title: "My App",
  description: "My App Description",
};

export default function CreateNewQuotationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <div className="bg-muted min-h-screen md:pl-20 ">
        <ConfirmDialogProvider>
          {children}
          <ToastContainer />
        </ConfirmDialogProvider>
      </div>
    </Layout>
  );
}
