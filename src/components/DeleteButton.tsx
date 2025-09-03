import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface DeleteConfirmButtonProps {
  onConfirm: () => void | Promise<void>;
  label: string;
}

export default function DeleteConfirmButton({ onConfirm, label }: DeleteConfirmButtonProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      setSubmitting(true);
      // ถ้าไม่อยากให้ dialog ปิดจนกว่าจะเสร็จ ให้ preventDefault()
      // e.preventDefault();
      await onConfirm();
      // ถ้าใช้ preventDefault ด้านบน ต้องจัดการปิดเองด้วย state ควบคุม <AlertDialog.Root open={...} />
    } catch (err) {
      console.error(err);
      // TODO: ใส่ toast แจ้ง error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <button
          className="p-2 rounded-full hover:bg-red-100 text-red-600 hover:cursor-pointer hover:scale-110 transition-all"
          aria-label="Delete"
        >
          <Trash2 size={20} />
        </button>
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 max-w-sm w-full -translate-x-1/2 -translate-y-1/2 bg-background p-6 rounded-lg shadow-lg">
          <AlertDialog.Title className="text-lg font-bold text-foreground">
            คุณแน่ใจหรือไม่?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-gray-600">
            {label}
          </AlertDialog.Description>

          <div className="mt-4 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <button
                disabled={submitting}
                className="px-4 py-2 bg-gray-800 text-white rounded-[0.75rem] hover:bg-gray-900 disabled:opacity-50 hover:cursor-pointer hover:scale-110 transition-all"
              >
                ยกเลิก
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="px-7 py-2 bg-red-600 text-white rounded-[0.75rem] hover:bg-red-700 disabled:opacity-50 hover:cursor-pointer hover:scale-110 transition-all"
              >
                {submitting ? "กำลังลบ..." : "ลบ"}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
