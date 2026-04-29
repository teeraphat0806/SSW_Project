// src/app/layout.tsx
import "../../globals.css";
import Layout from "../../../components/Layout";
import { ToastContainer } from "react-toastify";
export const metadata = {
  title: "My App",
  description: "My App Description",
};

export default function TestpageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <div className="bg-muted min-h-screen md:pl-25 print:pl-0 print:bg-white print:min-h-0">
        {children}
      </div>
      <ToastContainer />
    </Layout>
  );
}
