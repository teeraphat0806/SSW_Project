// src/app/layout.tsx
import Layout from "@/components/Layout";
export const metadata = {
  title: "Billing",
  description: "Billing Description",
};

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <div className="bg-muted min-h-screen md:pl-20">{children}</div>
    </Layout>
  );
}
