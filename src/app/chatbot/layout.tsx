"use client";

import Layout from "@/components/Layout";

export default function ChatBotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
