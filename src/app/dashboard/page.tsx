"use client";
import { useSession } from "next-auth/react";
import Dashboard from "@/components/Dashboard";
import type { Session } from "next-auth";

const Index = () => {
  const { data: session } = useSession();
  const user = session?.user as Session["user"];

  const role = user.role;

  return <Dashboard role={role} />;
};

export default Index;
