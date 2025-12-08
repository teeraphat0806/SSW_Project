import { Customer } from "./customer";
import { OrderPO } from "./orderPo";
import { Staff } from "./staff";
export interface Bill {
  id: number;
  customerId?: number | null;
  yourRef: string;
  invoiceNo: number;
  codeCustomer?: string | null;
  credit?: string | null;
  deliveryDate: string;
  deliveryOrderNo?: string | null;
  salesName?: string | null;
  deliveredBy?: string | null;
  description?: string | null;
  vatRate: number;
  subtotal?: number | null;
  grandTotal?: number | null;
  discount?: number | null;
  vat: number;
  dateReceive?: string | null;
  salesNameId?: number | null;
  deliveredById?: number | null;
  updatedAt: string;
  createdAt: string;

  Customer?: Customer | null;
  Staff_Bill_deliveredByToStaff?: Staff | null;
  Staff_Bill_salesNameToStaff?: Staff | null;
  OrderPO?: OrderPO[];
}
