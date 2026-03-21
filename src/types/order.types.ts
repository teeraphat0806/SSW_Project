import { CuttingMethod, ShapeSteel, status } from "./alltype";

export type SteelItem = {
  id: string;
  SteelId: number;
  steelType: string;
  shape: ShapeSteel;
  sequence: number;
  wide: number | null;
  length: number;
  thickness: number;
  amount: number;
  detail?: string | null;
  cuttingMethod: CuttingMethod;
  weight?: number | null;
  price: number;
  discount?: number | null;
  density: number;
  isOD: boolean;
  isServices: boolean;
  isPerAmount: boolean;
  job?: string | null;
};

export type SteelType = {
  id: string;
  steelType: string; // ใช้แสดงใน Select
  shape: ShapeSteel;
  price: number;
  density: number;
};
export type HeadOrderType = {
  poNumber: string | null;
  credit: number;
  deliveryDate: string;
  createdAt?: string;
};

export type ApiJobOrder = {
  id: number;
  poNumber: string | null;
  customerId: number;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: string;
  customerTaxId: string | null;
  customerFax: string | null;
  deliveryDate: Date;
  createdAt: Date;
  credit: number;
  steel: SteelItem[];
  status: status;
};

export type ApiOrder = {
  id: number;
  poNumber: string | null;
  customerId: string;
  deliveryDate?: string | null;
  createdAt?: string | null;

  credit?: number;
  steel: SteelItem[];
  status: status;
};
