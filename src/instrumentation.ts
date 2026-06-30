// Chạy 1 lần khi server Node khởi động — bật bộ hẹn giờ đơn định kỳ.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.ENABLE_SCHEDULER === "false") return;
  const { startSubscriptionScheduler } = await import("@/lib/scheduler");
  startSubscriptionScheduler();
}
