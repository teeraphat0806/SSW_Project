// src/app/layout.tsx
import Layout from "../../components/Layout";

import { ThemeProvider } from "next-themes";
export const metadata = {
  title: "My App",
  description: "My App Description",
};

export default function SaleDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <ThemeProvider attribute="class">
        <div className="bg-muted min-h-screen md:pl-20">{children}</div>
      </ThemeProvider>
    </Layout>
  );
}
