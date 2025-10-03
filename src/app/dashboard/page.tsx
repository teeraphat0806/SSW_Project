'use client';
import Dashboard from "../../components/Dashboard";
import { useSession } from "next-auth/react";
const Index = () => {
  const { data: session } = useSession();
  return <Dashboard role={(session?.user as { role?: string })?.role} />;
};

export default Index;
