"use client";

import Layout from "@/components/Layout";

export default function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      {" "}
      <div className="bg-muted min-h-screen md:pl-20">{children}</div>
    </Layout>
  );
}
