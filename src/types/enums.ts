export type Role =
  | "superadmin"
  | "guest"
  | "clerk"
  | "supervisor"
  | "accountant"
  | "cutter"
  | "delivery";

export type JobStatus =
  | "pending"
  | "cutting"
  | "weighing"
  | "ready"
  | "shipped"
  | "completed";

export type ShapeSteel = "square" | "line";
