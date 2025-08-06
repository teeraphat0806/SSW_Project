import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import "../app/globals.css";

import { Package, Ruler, Weight, Plus, X } from "lucide-react";

export default function AddItem({
  steelItems,
  formData,
  updateSteelItem,
  addSteelItem,
  removeSteelItem,
  steelTypes,
}) {
  return (
    <Card className="shadow-steel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Steel Items to Cut
            </CardTitle>
            <CardDescription>
              Specify the steel types and dimensions for cutting
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={addSteelItem}
            variant="outline"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {steelItems.map((item, index) => (
          <div key={item.id} className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground">
                Item #{index + 1}
              </h4>
              {steelItems.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSteelItem(item.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <Label>Steel Type *</Label>
                <Select
                  value={item.steelType}
                  onValueChange={(value) =>
                    updateSteelItem(item.id, "steelType", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select steel type" />
                  </SelectTrigger>
                  <SelectContent
                    className="bg-background text-foreground shadow-md border z-50 max-h-[160px] overflow-y-auto"
                    side="bottom"
                    align="start"
                    sideOffset={0}
                  >
                    {steelTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantity (pieces) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateSteelItem(
                      item.id,
                      "quantity",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Width (mm) *</Label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={item.width}
                  onChange={(e) =>
                    updateSteelItem(
                      item.id,
                      "width",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Length (mm) *</Label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={item.length}
                  onChange={(e) =>
                    updateSteelItem(
                      item.id,
                      "length",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Thickness (mm) *</Label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={item.thickness}
                  onChange={(e) =>
                    updateSteelItem(
                      item.id,
                      "thickness",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label>Item Notes</Label>
              <Textarea
                value={item.notes || ""}
                onChange={(e) =>
                  updateSteelItem(item.id, "notes", e.target.value)
                }
                placeholder="Specific cutting instructions for this item..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
