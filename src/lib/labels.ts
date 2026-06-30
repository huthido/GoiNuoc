// Nhãn tiếng Việt cho hiển thị UI (không thuộc domain thuần).
import type { OrderStatus, PaymentMethod, PaymentStatus, ProductType, Role } from "./domain/types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  ASSIGNED: "Đã phân tài xế",
  DELIVERING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
  FAILED: "Giao hụt",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  ASSIGNED: "bg-indigo-100 text-indigo-800",
  DELIVERING: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-gray-200 text-gray-600",
  FAILED: "bg-rose-100 text-rose-800",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: "Tiền mặt khi nhận",
  BANK: "Chuyển khoản",
  DEBT: "Ghi nợ",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  DEBT: "Còn nợ",
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  BINH_20L: "Bình 20L",
  THUNG_CHAI: "Thùng chai",
  CHAI_LE: "Chai lẻ",
  KHAC: "Khác",
};

export const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: "Khách hàng",
  ADMIN: "Quản trị",
  STAFF: "Nhân viên",
  DRIVER: "Tài xế",
};
