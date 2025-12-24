// src/app/่job-order-detail/[id]/layout.tsx
import "../../globals.css";
import Layout from "../../../components/Layout";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
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
          {children}
          <Toaster /> 
        </ThemeProvider>
      </div>
    </Layout>
  );
}
