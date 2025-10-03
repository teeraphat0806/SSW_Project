// src/app/layout.tsx
import "../globals.css";
import Layout from "../../components/Layout";
export const metadata = {
  title: "My App",
  description: "My App Description",
};

export default function SuperadminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
   return (
      <Layout>
            {children}
      </Layout>
    );
}
