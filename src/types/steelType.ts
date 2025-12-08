import { Product } from "./product";
import { SteelStock } from "./steelStock";
import { ShapeSteel } from "./enum/shapeSteel";

export interface SteelType {
  id: number;
  codeSteel: string;
  detail?: string | null;
  amount: number;
  shape: ShapeSteel;
  price: number;

  Product?: Product[];
  SteelStock?: SteelStock[];
  createdAt: string;
  updatedAt: string;
}
