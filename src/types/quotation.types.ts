import { CuttingMethod, ShapeSteel } from "./alltype";

export type SteelType = {
  id: string;
  steelType: string;
  shape: ShapeSteel;
  price: number;
  density: number;
};

export type HeadOrder = {
  quotationNo: string;
  credit: number | null;
  salesName: string;
  salesNameId: number;
  description: string | null;
  period: string | null;
  deliveryDate: string;
  createdAt: Date | null;
};

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
  surfaceT?: string | null;
  toleranceT?: string | null;
  surfaceW?: string | null;
  toleranceW?: string | null;
  surfaceL?: string | null;
  toleranceL?: string | null;
  isOD: boolean;
  isServices: boolean;
  isPerAmount: boolean;
};
