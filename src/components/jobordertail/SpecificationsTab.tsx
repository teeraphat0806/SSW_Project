"use client";
import { Ruler, CheckCircle } from "lucide-react";

type SpecsProps = {
  steelSpec: {
    type: string;
    quantity: string; // เช่น "50 pieces"
    width: string;    // "100 mm"
    length: string;   // "2000 mm"
    thickness: string;// "5 mm"
  };
  actual?: {
    width?: string;
    length?: string;
    thickness?: string;
  };
  note?: string;
};

export function SpecificationsTab({ steelSpec, actual, note }: SpecsProps) {
  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Steel Specs */}
        <div className="rounded-xl border border-gray-100 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            <h4 className="text-sm font-semibold">Steel Specifications</h4>
          </div>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-foreground">Steel Type:</dt>
            <dd className="font-medium">{steelSpec.type}</dd>
            <dt className="text-foreground">Quantity:</dt>
            <dd className="font-medium">{steelSpec.quantity}</dd>
            <dt className="text-foreground">Width:</dt>
            <dd className="font-medium">{steelSpec.width}</dd>
            <dt className="text-foreground">Length:</dt>
            <dd className="font-medium">{steelSpec.length}</dd>
            <dt className="text-foreground">Thickness:</dt>
            <dd className="font-medium">{steelSpec.thickness}</dd>
          </dl>
        </div>

        {/* Actual Dimensions */}
        <div className="rounded-xl border border-gray-100 p-4">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <h4 className="text-sm font-semibold">Actual Dimensions</h4>
          </div>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-foreground">Steel Type:</dt>
            <dd className="font-medium">{steelSpec.type}</dd>
            <dt className="text-foreground">Actual Width:</dt>
            <dd className="font-medium">{actual?.width ?? "-"}</dd>
            <dt className="text-foreground">Actual Length:</dt>
            <dd className="font-medium">{actual?.length ?? "-"}</dd>
            <dt className="text-foreground">Actual Thickness:</dt>
            <dd className="font-medium">{actual?.thickness ?? "-"}</dd>
          </dl>
        </div>
      </div>

       {(note && note.trim().length > 0) && (
        <div className="mt-6 rounded-xl border border-gray-100 p-4">
          <h4 className="mb-2 text-sm font-semibold">Special Instructions</h4>
          <p className="text-sm text-foreground">{note}</p>
        </div>
      )}
    </div>
  );
}
