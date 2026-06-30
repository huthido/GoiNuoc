// Máy trạng thái đơn — nguồn sự thật duy nhất cho việc chuyển trạng thái. Thuần, có test.
import type { OrderStatus, Role } from "./types";

/** Các trạng thái có thể đi tới từ một trạng thái. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["DELIVERING", "CANCELLED", "FAILED"],
  DELIVERING: ["DELIVERED", "FAILED"],
  DELIVERED: [],
  CANCELLED: [],
  FAILED: ["ASSIGNED"], // cho phép phân giao lại
};

/** Vai trò được phép thực hiện từng bước chuyển. Khóa: `${from}->${to}`. */
const ALLOWED_ROLES: Record<string, Role[]> = {
  "PENDING->CONFIRMED": ["ADMIN", "STAFF"],
  "PENDING->CANCELLED": ["ADMIN", "STAFF", "CUSTOMER"],
  "CONFIRMED->ASSIGNED": ["ADMIN", "STAFF"],
  "CONFIRMED->CANCELLED": ["ADMIN", "STAFF", "CUSTOMER"],
  "ASSIGNED->DELIVERING": ["DRIVER", "ADMIN"],
  "ASSIGNED->CANCELLED": ["ADMIN", "STAFF"],
  "ASSIGNED->FAILED": ["DRIVER", "ADMIN"],
  "DELIVERING->DELIVERED": ["DRIVER", "ADMIN"],
  "DELIVERING->FAILED": ["DRIVER", "ADMIN"],
  "FAILED->ASSIGNED": ["ADMIN", "STAFF"],
};

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function isTerminal(status: OrderStatus): boolean {
  return nextStatuses(status).length === 0;
}

export function canTransition(from: OrderStatus, to: OrderStatus, role?: Role): boolean {
  if (!TRANSITIONS[from]?.includes(to)) return false;
  if (!role) return true; // không xét vai trò
  const allowed = ALLOWED_ROLES[`${from}->${to}`];
  return allowed ? allowed.includes(role) : false;
}

export function assertTransition(from: OrderStatus, to: OrderStatus, role?: Role): void {
  if (!canTransition(from, to, role)) {
    throw new Error(
      `Chuyển trạng thái không hợp lệ: ${from} → ${to}${role ? ` (vai trò ${role})` : ""}`,
    );
  }
}
