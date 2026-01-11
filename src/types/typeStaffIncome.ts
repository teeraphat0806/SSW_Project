import { StaffIncome } from "./staffIncome";

export interface TypeStaffIncome {
  id: number;
  amount: number;
  name: string;
  types: string;
  incomes?: StaffIncome[];
  onDelete?: boolean;
}
