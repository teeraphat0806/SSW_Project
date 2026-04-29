"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  type OrderWithDetails,
} from "@/lib/saleDashboard/analytics-utils";

interface OrderDetailModalProps {
  order?: OrderWithDetails;
  orderId?: number | null;
  onClose: () => void;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  cutting: "bg-purple-100 text-purple-800",
  weighing: "bg-purple-100 text-purple-800",
  ready: "bg-blue-100 text-blue-800",
  shipped: "bg-green-100 text-green-800",
};

const statusLabels = {
  pending: "รอดำเนินการ",
  cutting: "กำลังตัด",
  weighing: "กำลังชั่ง",
  ready: "พร้อมจัดส่ง",
  shipped: "จัดส่งแล้ว",
};

export function OrderDetailModal({
  order,
  orderId,
  onClose,
}: OrderDetailModalProps) {
  if (!order) return null;

  const enrichedOrder = order as OrderWithDetails;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            รายละเอียดคำสั่งซื้อ {enrichedOrder.poNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">หมายเลข PO</p>
              <p className="font-semibold">{enrichedOrder.poNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">สถานะ</p>
              <Badge
                className={
                  statusColors[
                    enrichedOrder.status as keyof typeof statusColors
                  ]
                }
              >
                {
                  statusLabels[
                    enrichedOrder.status as keyof typeof statusLabels
                  ]
                }
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ลูกค้า</p>
              <p className="font-semibold">
                {enrichedOrder.customerName || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ยอดรวม</p>
              <p className="font-semibold text-lg">
                {formatCurrency(enrichedOrder.total)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">วันที่สร้าง</p>
              <p className="font-semibold">
                {new Date(enrichedOrder.createdAt).toLocaleDateString("th-TH")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">วันที่เสร็จสิ้น</p>
              <p className="font-semibold">
                {enrichedOrder.completedAt
                  ? new Date(enrichedOrder.completedAt).toLocaleDateString(
                      "th-TH"
                    )
                  : "-"}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
