import { CuttingMethod, ShapeSteel } from "@/types/alltype";
import { Prisma } from "@prisma/client";

export type ApiQuotation = {
  id: number;
  idPO: number;
  idBill?: number | null;
  customerId: number | null;
  customerName: string;
  companyName: string;
  address: string;
  tel: string | null;
  fax: string | null;
  credit: number;
  quotationNo: string;
  salesName: string;
  salesId: number;
  description: string | null;
  deliveryDate: string;
  createdAt: Date;
  updateAt: Date;
  steelItem: {
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
    toleranceT?: number | null;
    surfaceW?: string | null;
    toleranceW?: number | null;
    surfaceL?: string | null;
    toleranceL?: number | null;
    isOD: boolean;
    isServices: boolean;
    isPerAmount: boolean;
  }[];
};

type OrderWithRelation = Prisma.OrderPOGetPayload<{
  include: {
    Product: { include: { SteelType: true } };
    Quotation: true;
  };
}>;
