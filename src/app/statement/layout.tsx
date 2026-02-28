// src/app/layout.tsx
import Layout from "../../components/Layout";
export const metadata = {
  title: "My App",
  description: "My App Description",
};

export default function StatementLayout({
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
