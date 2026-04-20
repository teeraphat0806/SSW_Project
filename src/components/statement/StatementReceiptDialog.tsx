"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface StatementReceiptDialogProps {
  statementId?: number | null;
  customerId?: number;
  statementNo?: number | null;
  nextStatementNo?: number | null;
  openInitially?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function StatementReceiptDialog({
  statementId,
  openInitially = false,
  onOpenChange,
}: StatementReceiptDialogProps) {
  const router = useRouter();

  const goToPrintPage = () => {
    if (!statementId) return;
    router.push(`/statement/print/${statementId}`);
  };

  useEffect(() => {
    if (!openInitially || !statementId) return;
    router.push(`/statement/print/${statementId}`);
    onOpenChange?.(false);
  }, [openInitially, statementId, router, onOpenChange]);

  return (
    <Button
      size="icon"
      variant="outline"
      aria-label="Open statement print page"
      onClick={goToPrintPage}
      disabled={!statementId}
      className="cursor-pointer border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-100 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
    >
      <Printer size={18} />
    </Button>
  );
}
