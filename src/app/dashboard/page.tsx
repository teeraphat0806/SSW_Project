"use client";
import Dashboard from "@/components/Dashboard";
import { useSession } from "next-auth/react";

type UserRole = "clerk" | "supervisor" | "cutter" | "delivery";

const Index = () => {
  const { data: session } = useSession();

  const role = session?.user?.role as UserRole;

  return <Dashboard role={role} />;
};

export default Index;
