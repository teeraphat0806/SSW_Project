"use client";

import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ReceiptPage() {
  const router = useRouter();
  router.push("/not-found");
  return (
    <>
    </>
  );
}
