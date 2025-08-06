// src/app/layout.tsx
import "../globals.css";
import Layout from "@/components/Layout";
import { ThemeProvider } from "next-themes";
export const metadata = {
  title: "My App",
  description: "My App Description",
};

export default function CreateneworderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
          <ThemeProvider attribute="class">{children}</ThemeProvider>;
    </Layout>
  );
}