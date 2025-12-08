import { SteelType } from "./steelType";

export interface SteelStock {
  id: number;
  width: number;
  length: number;
  thickness: number;
  status: string;

  createdAt: string;
  updatedAt: string;

  steeltypeId: number;
  SteelType: SteelType;
}
