"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface AcquittanceReceiptDialogProps {
  customerId?: number;
  acquittanceNo: number | null;
  acquittanceId?: number;
  nextAcquittanceNo?: number | null;
  openInitially?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function AcquittanceReceiptDialog({
  acquittanceId,
  openInitially = false,
  onOpenChange,
}: AcquittanceReceiptDialogProps) {
  const router = useRouter();

  const goToPrintPage = () => {
    if (!acquittanceId) return;
    router.push(`/acquittance/print/${acquittanceId}`);
  };

  useEffect(() => {
    if (!openInitially || !acquittanceId) return;
    router.push(`/acquittance/print/${acquittanceId}`);
    onOpenChange?.(false);
  }, [openInitially, acquittanceId, router, onOpenChange]);

  return (
    <Button
      size="icon"
      variant="outline"
      aria-label="Open acquittance print page"
      onClick={goToPrintPage}
      disabled={!acquittanceId}
      className="cursor-pointer border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-100 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
    >
      <Printer size={18} />
    </Button>
  );
}
