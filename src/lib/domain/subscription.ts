// Logic lịch đặt định kỳ — thuần, không phụ thuộc Next/Prisma. Nhận/đưa Date qua tham số.
import type { SubscriptionFrequency } from "./types";

/** Ngày chạy kế tiếp tính từ một mốc theo tần suất. */
export function computeNextRun(from: Date, frequency: SubscriptionFrequency): Date {
  const d = new Date(from);
  if (frequency === "WEEKLY") d.setDate(d.getDate() + 7);
  else if (frequency === "BIWEEKLY") d.setDate(d.getDate() + 14);
  else d.setMonth(d.getMonth() + 1); // MONTHLY
  return d;
}

/** Lịch đã tới hạn chạy chưa. */
export function isDue(nextRunAt: Date | null | undefined, now: Date): boolean {
  return !!nextRunAt && nextRunAt.getTime() <= now.getTime();
}

/**
 * Dồn nextRunAt về tương lai gần nhất (phòng khi bỏ lỡ nhiều kỳ vì hệ thống tắt lâu).
 * Trả về mốc kế tiếp đầu tiên > now.
 */
export function advanceUntilFuture(
  nextRunAt: Date,
  frequency: SubscriptionFrequency,
  now: Date,
): Date {
  let next = computeNextRun(nextRunAt, frequency);
  let guard = 0;
  while (next.getTime() <= now.getTime() && guard < 1000) {
    next = computeNextRun(next, frequency);
    guard++;
  }
  return next;
}
