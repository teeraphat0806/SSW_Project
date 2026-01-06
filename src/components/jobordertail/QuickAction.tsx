"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Edit, Printer, Mail, FileText } from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "../../hooks/use-toast";

type ActionKey = "edit" | "print" | "email" | "pofile";

type ActionItem = {
  key: ActionKey;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  run: () => Promise<void> | void; // ฟังก์ชันเฉพาะของปุ่ม
  visible?: boolean;
  disabled?: boolean;
};

// รับได้ทั้ง string และ number ป้องกัน type mismatch
export function QuickAction({
  billid,
  orderId,
  status,
  keyPo,
}: {
  billid: string | number;
  orderId: string | number;
  keyPo?: string;

  status:
    | "pending"
    | "cutting"
    | "weighing"
    | "ready"
    | "shipped"
    | "completed"
    | "canceled";
}) {
  const router = useRouter();
  const [loadingKey, setLoadingKey] = React.useState<ActionKey | null>(null);

  const actions: ActionItem[] = [
    {
      key: "edit",
      label: "แก้ไขออเดอร์ (Edit Order)",
      disabled: status === "canceled",
      icon: Edit,
      run: () => router.push(`/up-date-order/${orderId}`),
    },
    {
      key: "print",
      label: "พิมพ์ใบสั่งซื้อ (Receipt) ",
      disabled: status === "canceled",
      icon: Printer,
      run: () => router.push(`/receipt-invoice/${billid}`),
    },
    // {
    //   key: "email",
    //   label: "Email Customer",
    //   icon: Mail,
    //   run: async () => {
    //     const res = await fetch(`/api/orders/${orderId}/email`, {
    //       method: "POST",
    //     });
    //     if (!res.ok) throw new Error("Send email failed");
    //     toast({
    //       title: "Email sent",
    //       description: "Customer has been notified.",
    //     });
    //   },
    // },
    {
      key: "pofile",
      label: "แสดงใบสั่งซื้อ (PO File)",
      icon: FileText,
      run: () => {
        if (!keyPo) return; // กันกรณี keyPo เป็น undefined
        console.log("Open PO File:", keyPo);
        window.open(`/api/upload/po/openPo/${keyPo}`, "_blank");
        toast({ title: "เปิดใบสั่งซื้อแล้ว" });
      },
      disabled: status === "canceled" || !keyPo,
    },
  ];

  const handleClick = async (a: ActionItem) => {
    if (a.disabled || loadingKey) return; // กันดับเบิลคลิก
    try {
      setLoadingKey(a.key);
      await a.run();
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e.message ?? "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-background p-5 shadow-sm dark:border-gray-800">
      <h3 className="text-base font-semibold">Quick Actions</h3>

      <div className="mt-3 grid gap-2">
        {actions
          .filter((a) => a.visible !== false)
          .map((a) => {
            const Icon = a.icon;
            const isLoading = loadingKey === a.key;
            return (
              <Button
                key={a.key}
                variant="outline"
                onClick={() => handleClick(a)} // ← ส่ง action ตรง ๆ
                disabled={a.disabled || isLoading}
                aria-busy={isLoading}
                className="
                  group w-full justify-start rounded-xl border transition-all
                  hover:bg-accent hover:text-accent-foreground
                  focus-visible:ring-2 focus-visible:ring-ring
                  active:scale-[0.99]
                "
              >
                <Icon
                  className={`mr-2 h-4 w-4 transition-transform ${
                    isLoading ? "" : "group-hover:translate-x-0.5"
                  }`}
                />
                <span className="text-sm">
                  {isLoading ? "Processing..." : a.label}
                </span>
              </Button>
            );
          })}
      </div>
    </div>
  );
}
