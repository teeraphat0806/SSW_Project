// src/app/layout.tsx
import "../globals.css";

import Layout from "@/components/Layout";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
