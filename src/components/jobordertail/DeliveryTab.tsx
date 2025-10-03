"use client";

import * as React from "react";
import { Truck, Calendar } from "lucide-react";
import { Button } from "../../components/ui/button";

export type JobStatus =
  | "pending"
  | "cutting"
  | "weighing"
  | "ready"
  | "shipped"
  | "completed";

export type DeliveryTabOrops = {
  status: JobStatus;
  deliveryDate?: string | null;
  deliveryAddress?: string | null;
  onUpdateStatus: (newStatus: JobStatus) => void;
  className?: string;
};

export function DeliveryTab({
  status,
  deliveryDate,
  deliveryAddress,
  onUpdateStatus,
  className,
}: DeliveryTabOrops) {
  const canShip = status === "ready";
  const canComplete = status === "shipped";
  return (
    <div
      className={["px-5 py-4 space-y-4", className].filter(Boolean).join(" ")}
    >
      <div className="rounded-xl border border-gray-100 p-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h4 className="flex items-center gap-2 font-semibold">
            <Truck className="h-4 w-4" />
            Delivery Information
          </h4>

          {deliveryDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{deliveryDate}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Button
            variant={status === "shipped" ? "default" : "outline"}
            onClick={() => onUpdateStatus("shipped")}
            disabled={!canShip}
          >
            Mark as Shipped
          </Button>

          {/* หมายเหตุ: ถ้า theme ของคุณไม่มี variant="success"
             ให้เปลี่ยนเป็น "default" + ใส่ className สีเขียวเอง */}
          <Button
            variant={status === "completed" ? "success" : "outline"}
            onClick={() => onUpdateStatus("completed")}
            disabled={!canComplete}
          >
            Mark as Delivered
          </Button>
        </div>

        {/* Address */}
        {deliveryAddress && (
          <div className="mt-4 rounded-lg bg-muted p-4">
            <h5 className="mb-2 font-medium">Delivery Address</h5>
            <p className="text-sm text-muted-foreground">{deliveryAddress}</p>
          </div>
        )}
      </div>
    </div>
  );
}
