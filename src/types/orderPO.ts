import { Bill } from './bill';
import { Customer } from './customer';
import { Staff } from './staff';
import { Product } from './product';
import { JobStatus } from './enums';

export interface OrderPO {
  id: number;
  poNumber: string;
  customerId?: number | null;
  billId?: number | null;
  status: JobStatus;
  total: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  urlPo: string[];

  bill?: Bill | null;
  Customer?: Customer | null;
  Staff?: Staff[];
  Product?: Product[];
}
