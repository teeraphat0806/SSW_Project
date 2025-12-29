import { Role } from "./enums";
import { Staff } from "./staff";

export interface User {
  id: number;
  name?: string | null;
  email: string;
  password: string;
  image?: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
  staff?: Staff | null;
}
