"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, XCircle } from "lucide-react";

export function CancelOrderButton({
  jobOrder,
  isUpdating,
  onConfirm,
}: {
  jobOrder: { id: string | number; status: string } | null;
  isUpdating: boolean;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);

  const isCanceled = jobOrder?.status === "canceled";

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={!jobOrder || isUpdating || isCanceled}
          className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-none dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/40 dark:hover:bg-red-900/35"
        >
          <XCircle className="w-4 h-4 mr-2" />
          {isCanceled ? "ยกเลิกแล้ว" : "ยกเลิกออเดอร์"}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 text-red-500 mb-2">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-xl text-zinc-900 dark:text-zinc-100">
              ยืนยันการยกเลิกออเดอร์?
            </AlertDialogTitle>
          </div>

          <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400 text-base ml-2">
            คุณกำลังจะยกเลิกออเดอร์หมายเลข{" "}
            <span className="font-bold text-zinc-900 dark:text-zinc-200">
              #{jobOrder?.id}
            </span>
            <br />
            <span className="text-red-500 text-sm mt-2 block bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-100 dark:border-red-900/20">
              ⚠️ คำเตือน: เมื่อยกเลิกแล้วจะไม่สามารถกู้คืนหรือเปลี่ยนสถานะต่อได้
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel
            disabled={isUpdating}
            className="rounded-lg border-zinc-200 dark:border-zinc-700"
          >
            เปลี่ยนใจ (ไม่ยกเลิก)
          </AlertDialogCancel>

          <AlertDialogAction
            // สำคัญ: กัน dialog ปิดเอง แล้วคุมปิดเองเมื่อสำเร็จ
            onClick={async (e) => {
              e.preventDefault();
              if (!jobOrder || isUpdating || isCanceled) return;

              await onConfirm(); // เรียก handleCancelOrder
              // ถ้าไม่มี error (คุณ toast แล้ว) ก็ปิด dialog
              setOpen(false);
            }}
            disabled={isUpdating || isCanceled}
            className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            {isUpdating ? "กำลังยกเลิก..." : "ยืนยันการยกเลิก"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
