// Tiện ích định dạng cho UID hiển thị (tiếng Việt).

const vnd = new Intl.NumberFormat("vi-VN");

/** Định dạng tiền VND, vd 25000 -> "25.000₫". */
export function formatVND(amount: number): string {
  return vnd.format(Math.round(amount)) + "₫";
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
