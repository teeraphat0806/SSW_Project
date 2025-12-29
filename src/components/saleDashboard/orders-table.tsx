"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate, type OrderWithDetails } from "@/lib/saleDashboard/analytics-utils"
import { OrderDetailModal } from "./order-detail-modal"

interface OrdersTableProps {
  orders: OrderWithDetails[]
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

export function OrdersTable({ orders }: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>หมายเลข PO</TableHead>
              <TableHead>ลูกค้า</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">ยอดรวม</TableHead>
              <TableHead>วันที่สร้าง</TableHead>
              <TableHead>ใบแจ้งหนี้</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  ไม่พบข้อมูลคำสั่งซื้อ
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{order.poNumber}</TableCell>
                  <TableCell>{order.customerName || "-"}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>{order.billInvoiceNo ? `#${order.billInvoiceNo}` : "-"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                      รายละเอียด
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </>
  )
}
