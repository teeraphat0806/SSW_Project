import { Staff } from "./staff";
import { TypeStaffIncome } from "./typeStaffIncome";

export interface StaffIncome {
  id: number;
  amount: number;
  nameIncome: string;
  detail: string;
  staffId: number;
  date: string;

  Staff: Staff;
  typeId?: number | null;
  type?: TypeStaffIncome | null;
}
