import { OrderPO } from "./orderPo";
import { SteelType } from "./steelType";

export interface Product {
  id: number;
  orderPOId: number;
  steelId: number;
  wide?: number | null;
  length?: number | null;
  thickness?: number | null;
  amount: number;
  detail?: string | null;
  calculatedWeight?: number | null;
  actualWeight?: number | null;
  actualWide?: number | null;
  actualLength?: number | null;
  actualThickness?: number | null;
  total: number;
  price: number | null;
  weight?: number | null;
  OrderPO?: OrderPO;
  SteelType?: SteelType;
}
