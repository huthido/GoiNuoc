// Các "enum" nghiệp vụ. SQLite không có enum nên lưu String; đây là nguồn sự thật cho giá trị hợp lệ.

export const ROLES = ["CUSTOMER", "ADMIN", "STAFF", "DRIVER"] as const;
export type Role = (typeof ROLES)[number];

// Đa vai trò: lưu CSV trong User.roles (SQLite không có array/enum). Token role đều là duy nhất nên không trùng substring.
export function parseRoles(csv: string | null | undefined): Role[] {
  if (!csv) return [];
  const set = new Set(csv.split(",").map((s) => s.trim()));
  return ROLES.filter((r) => set.has(r));
}

export function rolesToCsv(roles: Role[]): string {
  const set = new Set(roles);
  return ROLES.filter((r) => set.has(r)).join(",");
}

export function hasAnyRole(userRoles: Role[], allowed: Role[]): boolean {
  return userRoles.some((r) => allowed.includes(r));
}

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "ASSIGNED",
  "DELIVERING",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["COD", "BANK", "DEBT"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["UNPAID", "PAID", "DEBT"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PRODUCT_TYPES = ["BINH_20L", "THUNG_CHAI", "CHAI_LE", "KHAC"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const SUBSCRIPTION_FREQUENCIES = ["WEEKLY", "BIWEEKLY", "MONTHLY"] as const;
export type SubscriptionFrequency = (typeof SUBSCRIPTION_FREQUENCIES)[number];
