import { CuttingMethod, ShapeSteel } from "./alltype";

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
  detail: string;
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
