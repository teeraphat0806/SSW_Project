"use client";
import { Scissors } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

type ProductionStatus = "pending" |"cutting" | "weighing" | "ready" | "shipped"|"completed";

type ProductionTabProps = {
  status: ProductionStatus;
  assignedCutter?: string | null;
  onUpdateStatus: (newStatus: ProductionStatus) => void;
  getStatusColor: (status: ProductionStatus) => string;
};

export function ProductionTab({
  status,
  assignedCutter,
  onUpdateStatus,
  getStatusColor,
}: ProductionTabProps) {
  const disabled = status === "completed";

  return (
    <div className="px-5 py-4 space-y-4">
      <div className="rounded-xl border border-gray-100 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="flex items-center gap-2 font-semibold">
            <Scissors className="h-4 w-4" />
            Production Status
          </h4>
          <Badge className={getStatusColor(status)}>{status.toUpperCase()}</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Button
            variant={status === "cutting" ? "default" : "outline"}
            className={status === "cutting" ? "text-white" : ""}
            onClick={() => onUpdateStatus("cutting")}
            disabled={disabled}
          >
            Start Cutting
          </Button>
          <Button
            variant={status === "weighing" ? "default" : "outline"}
            className={status === "weighing" ? "text-white" : ""}
            onClick={() => onUpdateStatus("weighing")}
            disabled={disabled}
          >
            Mark for Weighing
          </Button>
          <Button
            variant={status === "ready" ? "default" : "outline"}
            className={status ==="ready"? "text-white": ""}
            onClick={() => onUpdateStatus("ready")}
            disabled={disabled}
          >
            Mark Ready
          </Button>
        </div>

        {assignedCutter && (
          <div className="mt-4 rounded-lg bg-muted p-4">
            <h5 className="mb-2 font-medium">Assigned Cutter</h5>
            <p className="text-sm text-muted-foreground">{assignedCutter}</p>
          </div>
        )}
      </div>
    </div>
  );
}
