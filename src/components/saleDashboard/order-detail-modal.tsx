"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, type OrderWithDetails } from "@/lib/saleDashboard/analytics-utils"
import { mockBills, mockOrders, mockCustomers } from "@/lib/saleDashboard/mock-data"

interface OrderDetailModalProps {
  order?: OrderWithDetails
  orderId?: number | null
  onClose: () => void
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

const statusLabels = {
  pending: "รอดำเนินการ",
  in_progress: "กำลังดำเนินการ",
  completed: "เสร็จสมบูรณ์",
  cancelled: "ยกเลิก",
}

export function OrderDetailModal({ order, orderId, onClose }: OrderDetailModalProps) {
  const orderData = order || (orderId ? mockOrders.find((o) => o.id === orderId) : null)

  if (!orderData) return null

  const enrichedOrder: OrderWithDetails = {
    ...orderData,
    customerName: orderData.customerName || mockCustomers.find((c) => c.id === orderData.customerId)?.name || "ไม่ระบุ",
  }

  const bill = enrichedOrder.billId ? mockBills.find((b) => b.id === enrichedOrder.billId) : null

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>รายละเอียดคำสั่งซื้อ {enrichedOrder.poNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">หมายเลข PO</p>
              <p className="font-semibold">{enrichedOrder.poNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">สถานะ</p>
              <Badge className={statusColors[enrichedOrder.status]}>{statusLabels[enrichedOrder.status]}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ลูกค้า</p>
              <p className="font-semibold">{enrichedOrder.customerName || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ยอดรวม</p>
              <p className="font-semibold text-lg">{formatCurrency(enrichedOrder.total)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">วันที่สร้าง</p>
              <p className="font-semibold">{formatDate(enrichedOrder.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">วันที่เสร็จสิ้น</p>
              <p className="font-semibold">{enrichedOrder.completedAt ? formatDate(enrichedOrder.completedAt) : "-"}</p>
            </div>
          </div>

          {bill && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">ข้อมูลใบแจ้งหนี้</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">เลขที่ใบแจ้งหนี้</p>
                  <p className="font-semibold">#{bill.invoiceNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">วันที่จัดส่ง</p>
                  <p className="font-semibold">{formatDate(bill.deliveryDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ยอดรวมก่อน VAT</p>
                  <p className="font-semibold">{formatCurrency(bill.subtotal || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">VAT ({bill.vatRate}%)</p>
                  <p className="font-semibold">{formatCurrency(bill.vat)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ส่วนลด</p>
                  <p className="font-semibold">{formatCurrency(bill.discount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ยอดรวมสุทธิ</p>
                  <p className="font-semibold text-lg">{formatCurrency(bill.grandTotal || 0)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">รายละเอียด</p>
                  <p className="font-semibold">{bill.description || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">พนักงานขาย</p>
                  <p className="font-semibold">{bill.salesName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ผู้จัดส่ง</p>
                  <p className="font-semibold">{bill.deliveredBy || "-"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
