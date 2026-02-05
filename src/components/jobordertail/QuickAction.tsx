"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Edit, Printer, FileText, File, ChevronRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "react-toastify";

// ถ้าคุณมี shadcn อยู่แล้ว แนะนำใช้ DropdownMenu
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu";

type ActionKey = "edit" | "print" | "pofile" | "printcutter";

type ActionItem = {
  key: ActionKey;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  run: () => Promise<void> | void;
  visible?: boolean;
  disabled?: boolean;
};

const openPoUrl = (objectKey: string) =>
  "/api/upload/po/openPo/" +
  objectKey.split("/").map(encodeURIComponent).join("/");

const fileNameFromKey = (k: string) =>
  decodeURIComponent(k.split("/").at(-1) ?? k);

export function QuickAction({
  billid,
  orderId,
  status,
  keyPo,
}: {
  billid: string | number;
  orderId: string | number;
  keyPo?: string[];
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

  const poKeys = Array.isArray(keyPo) ? keyPo.filter(Boolean) : [];
  const hasPo = poKeys.length > 0;
  const isCanceled = status === "canceled";

  const actions: ActionItem[] = [
    {
      key: "edit",
      label: "แก้ไขออเดอร์ (Edit Order)",
      disabled: isCanceled,
      icon: Edit,
      run: () => router.push(`/up-date-order/${orderId}`),
    },
    {
      key: "print",
      label: "พิมพ์ใบสั่งซื้อ (Receipt)",
      disabled: isCanceled,
      icon: Printer,
      run: () => router.push(`/receipt-invoice/${billid}?cutterKey=false`),
    },
    {
      key: "printcutter",
      label: "พิมพ์ให้คนตัด (Cutter Slip)",
      disabled: isCanceled,
      icon: Printer,
      run: () => router.push(`/receipt-invoice/${billid}?cutterKey=true`),
    },

    // NOTE: pofile จะ render แยกเป็น dropdown ด้านล่าง (เพราะต้องรองรับหลายไฟล์)
  ];

  const handleClick = async (a: ActionItem) => {
    if (a.disabled || loadingKey) return;
    try {
      setLoadingKey(a.key);
      await a.run();
    } catch (e: any) {
      toast.error("เกิดข้อผิดพลาดกรุณาลองใหม่อีกครั้ง: ", {
        position: "bottom-right",
      });
    } finally {
      setLoadingKey(null);
    }
  };

  const openOne = (k: string) => {
    window.open(openPoUrl(k), "_blank", "noopener,noreferrer");
    toast.success("เปิดใบ PO แล้ว: ", {
      position: "bottom-right",
    });
  };

  // const openAll = () => {
  //   // หมายเหตุ: บางเบราว์เซอร์อาจ block popup ถ้าเปิดหลายแท็บ
  //   poKeys.forEach((k) =>
  //     window.open(openPoUrl(k), "_blank", "noopener,noreferrer")
  //   );
  //   toast.success(`เปิดใบ PO ทั้งหมดแล้ว: ${poKeys.length} ไฟล์`, {
  //     position: "bottom-right",
  //   });
  // };

  return (
    <div className="rounded-2xl border border-gray-200 bg-background p-5 shadow-sm dark:border-gray-800">
      <h3 className="text-base font-semibold">Quick Actions</h3>

      <div className="mt-3 grid gap-2">
        {/* ปุ่มหลัก edit/print */}
        {actions.map((a) => {
          const Icon = a.icon;
          const isLoading = loadingKey === a.key;
          return (
            <Button
              key={a.key}
              variant="outline"
              onClick={() => handleClick(a)}
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

        {/* ปุ่ม PO: ถ้ามีไฟล์เดียว เปิดเลย / ถ้าหลายไฟล์ให้เลือก */}
        {hasPo && actions.length > 0 && (
          <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800 mx-2" />
        )}

        {/* Group 2: PO Documents */}
        {poKeys.length > 0 && (
          <>
            {poKeys.length <= 1 ? (
              // Single PO File
              <Button
                variant="ghost"
                disabled={isCanceled}
                onClick={() => openOne(poKeys[0])}
                className="
              group w-full justify-between rounded-lg  border transition-all px-3 py-2 h-auto
              text-zinc-600 hover:text-zinc-900 hover:bg-blue-50/50
              dark:text-zinc-400 dark:hover:text-blue-100 dark:hover:bg-blue-900/20
            "
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 border  border-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="text-left flex flex-col">
                    <span className="text-sm font-medium">ใบสั่งซื้อ (PO)</span>
                    <span className="textxs text-zinc-400 font-normal">
                      คลิกเพื่อเปิดไฟล์
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-blue-400 transition-colors" />
              </Button>
            ) : (
              // Multiple PO Files (Dropdown)
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    disabled={isCanceled}
                    className="
                  group w-full justify-between rounded-lg px-3 py-2 h-auto
                  text-zinc-600 hover:text-zinc-900 hover:bg-blue-50/50
                  dark:text-zinc-400 dark:hover:text-blue-100 dark:hover:bg-blue-900/20
                "
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="text-left flex flex-col">
                        <span className="text-sm font-medium">
                          ใบสั่งซื้อ (PO)
                        </span>
                        <span className="textxs text-zinc-400 font-normal">
                          มีทั้งหมด {poKeys.length} ไฟล์
                        </span>
                      </div>
                    </div>
                    {/* Badge นับจำนวน */}
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 textxs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                      {poKeys.length}
                    </span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-64 rounded-xl border-zinc-200 shadow-lg dark:border-zinc-800"
                >
                  <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500">
                    เลือกไฟล์ที่ต้องการเปิด
                  </div>
                  {poKeys.map((k, idx) => (
                    <DropdownMenuItem
                      key={k}
                      onClick={() => openOne(k)}
                      className="cursor-pointer gap-2 rounded-lg py-2"
                    >
                      <File className="h-3.5 w-3.5 text-blue-500" />
                      <span className="truncate text-sm">
                        {idx + 1}. {fileNameFromKey(k)}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        )}

        {/* State: No PO */}
        {!hasPo && (
          <div className="px-3 py-2 flex items-center gap-3 opacity-50 cursor-not-allowed select-none">
            <div className="p-1.5 rounded-md bg-zinc-100 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700">
              <FileText className="h-4 w-4 text-zinc-400" />
            </div>
            <span className="text-sm text-zinc-400 font-medium">
              ไม่มีไฟล์ PO
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
