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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import CreateStatementDialog from "@/components/statement/CreateStatementDialog";

type ActionKey =
  | "edit"
  | "print"
  | "pofile"
  | "printcutter"
  | "printtemporary"
  | "printbilling";

type ActionItem = {
  key: ActionKey;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  run: () => Promise<void> | void;
  visible?: boolean;
  disabled?: boolean;
};

type PreSelectInvoiceData = {
  customerId: number;
  invoiceId: number;
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
  customerId,
  codetoinvoice,
}: {
  billid: string | number;
  orderId: string | number;
  keyPo?: string[];
  customerId?: string | number | null;
  codetoinvoice?: number | null;
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
  const [tempReceiptDialog, setTempReceiptDialog] = React.useState(false);
  const [orderData, setOrderData] = React.useState<any>(null);
  const [deliveryAddress, setDeliveryAddress] = React.useState("");
  const [preSelectData, setPreSelectData] =
    React.useState<PreSelectInvoiceData | null>(null);
  const [billingDialogOpen, setBillingDialogOpen] = React.useState(false);
  const [invoiceExists, setInvoiceExists] = React.useState<boolean | null>(
    null,
  );
  const [checkingInvoice, setCheckingInvoice] = React.useState(false);

  const poKeys = Array.isArray(keyPo) ? keyPo.filter(Boolean) : [];
  const hasPo = poKeys.length > 0;
  const isCanceled = status === "canceled";

  // เช็คว่า Invoice มีอยู่หรือไม่
  React.useEffect(() => {
    if (!codetoinvoice || !customerId) {
      setInvoiceExists(false);
      return;
    }

    const checkInvoice = async () => {
      setCheckingInvoice(true);
      try {
        // Check if OrderPO has invoice by querying OrderPO with Invoice relation
        const res = await fetch(`/api/orderPo/${orderId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          setInvoiceExists(false);
          return;
        }

        const orderData = await res.json();
        // Check if Invoice exists (orderData.Invoice will exist if there's an invoice)
        const hasInvoice = orderData?.Invoice != null;
        setInvoiceExists(hasInvoice);

        if (hasInvoice) {
          setPreSelectData({
            customerId: Number(customerId),
            invoiceId: orderData.Invoice.id,
          });
        }
      } catch (error) {
        console.error("Failed to check invoice:", error);
        setInvoiceExists(false);
      } finally {
        setCheckingInvoice(false);
      }
    };

    checkInvoice();
  }, [codetoinvoice, customerId, orderId]);

  const actions: ActionItem[] = [
    {
      key: "edit",
      label: "แก้ไขออเดอร์ ",
      disabled: isCanceled,
      icon: Edit,
      run: () => router.push(`/up-date-order/${orderId}`),
    },
    {
      key: "print",
      label: "พิมพ์ใบกำกับภาษี ",
      disabled: isCanceled,
      icon: Printer,
      run: () => router.push(`/receipt-invoice/${billid}?cutterKey=false`),
    },
    {
      key: "printcutter",
      label: "พิมพ์ให้คนตัด ",
      disabled: isCanceled,
      icon: Printer,
      run: () => router.push(`/receipt-invoice/${billid}?cutterKey=true`),
    },
    {
      key: "printtemporary",
      label: "พิมพ์ใบส่งสินค้าชั่วคราว",
      disabled: isCanceled,
      icon: Printer,
      run: async () => {
        try {
          const res = await fetch(`/api/receipt/${billid}`);
          const data = await res.json();
          setOrderData(data);
          setDeliveryAddress(data.customer?.address || "");
          setTempReceiptDialog(true);
        } catch (error) {
          toast.error("ไม่สามารถโหลดข้อมูลได้", {
            position: "bottom-right",
          });
        }
      },
    },
    {
      key: "printbilling",
      label: "พิมพ์ใบเสร็จรับเงิน",
      disabled: isCanceled || invoiceExists === false || checkingInvoice,
      icon: Printer,
      run: () => setBillingDialogOpen(true),
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

  const handleConfirmTempReceipt = () => {
    if (!deliveryAddress.trim()) {
      toast.error("กรุณากรอกที่อยู่จัดส่ง", {
        position: "bottom-right",
      });
      return;
    }
    setTempReceiptDialog(false);
    router.push(
      `/receipt-invoice/${billid}?isTemporary=true&deliveryAddress=${encodeURIComponent(deliveryAddress)}`,
    );
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

      {/* Temporary Receipt Dialog */}
      <Dialog open={tempReceiptDialog} onOpenChange={setTempReceiptDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>พิมพ์ใบส่งสินค้าชั่วคราว</DialogTitle>
          </DialogHeader>

          {orderData && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div>
                <Label className="text-sm font-semibold">ชื่อลูกค้า</Label>
                <div className="mt-1 text-sm">{orderData.customer?.name}</div>
              </div>

              {/* Items List */}
              <div>
                <Label className="text-sm font-semibold">รายการสินค้า</Label>
                <div className="mt-2 border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">ชนิดเหล็ก</th>
                        <th className="p-2 text-left">ขนาด</th>
                        <th className="p-2 text-center">จำนวน</th>
                        <th className="p-2 text-right">น้ำหนัก</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderData.steel?.map((item: any, index: number) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">{item.steelType}</td>
                          <td className="p-2">
                            {item.thickness} x {item.width || 0} x {item.length}{" "}
                            mm
                          </td>
                          <td className="p-2 text-center">{item.amount}</td>
                          <td className="p-2 text-right">
                            {(item.weight ?? 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Delivery Address Input */}
              <div>
                <Label
                  htmlFor="deliveryAddress"
                  className="text-sm font-semibold"
                >
                  ที่อยู่จัดส่ง *
                </Label>
                <Input
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="กรอกที่อยู่จัดส่ง"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTempReceiptDialog(false)}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleConfirmTempReceipt}>ยืนยันและพิมพ์</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statement Dialog for pre-selected invoice */}
      {billingDialogOpen && preSelectData && (
        <CreateStatementDialog
          customers={[
            {
              id: preSelectData.customerId,
              name: "ลูกค้า",
            },
          ]}
          preSelectCustomerId={preSelectData.customerId}
          preSelectInvoiceIds={[preSelectData.invoiceId]}
          openInitially={true}
          onOpenChange={(open) => {
            setBillingDialogOpen(open);
          }}
          onCreate={async (data) => {
            try {
              const res = await fetch("/api/statement/create-with-invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
              if (res.ok) {
                toast.success("สร้างใบเสร็จรับเงินสำเร็จ", {
                  position: "bottom-right",
                });
                setBillingDialogOpen(false);
                // Optionally navigate to statement page
                // router.push("/statement");
              } else {
                toast.error("สร้างใบเสร็จรับเงินล้มเหลว", {
                  position: "bottom-right",
                });
              }
            } catch (error) {
              toast.error("เกิดข้อผิดพลาด: " + (error as Error).message, {
                position: "bottom-right",
              });
            }
          }}
          loading={false}
        />
      )}
    </div>
  );
}
