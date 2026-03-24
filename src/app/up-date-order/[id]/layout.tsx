//src/app/up-date-order/[id]/layout.tsx
import "../../globals.css";
import Layout from "@/components/Layout";
import { ConfirmDialogProvider } from "@/components/providers/confirm-dialog-provider";
import { ToastContainer } from "react-toastify";

export const metadata = {
  title: "My App",
  description: "My App Description",
};

export default function UpdateOrderLayout({
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
