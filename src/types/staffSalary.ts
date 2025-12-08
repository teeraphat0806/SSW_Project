import { Staff } from "./staff";
export interface StaffSalary {
  id: number;
  staffId: number;
  amount: number;
  effectiveDate: string;
  detail?: string | null;
  createdBy?: number | null;
  createdAt: string;

  Staff: Staff;
}
