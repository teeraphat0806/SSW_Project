export type status =
  | "pending"
  | "cutting"
  | "weighing"
  | "ready"
  | "shipped"
  | "completed"
  | "canceled";

export type userRole =
  | "superadmin"
  | "guest"
  | "clerk"
  | "supervisor"
  | "accountant"
  | "cutter"
  | "delivery";

export type CuttingMethod = "normal" | "FB" | "RM" | "CNC";

export type ShapeSteel = "square" | "line";
