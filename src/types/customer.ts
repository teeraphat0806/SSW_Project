import { Bill } from "./bill";
import { OrderPO } from "./orderPO";
export interface Customer {
  id: number;
  code: string;
  name: string;
  address: string;
  tel: string;
  taxNumber: string;
  faxNumber: string;
  email: string;

  Bill?: Bill[];
  OrderPO?: OrderPO[];
}
