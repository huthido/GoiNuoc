// Bộ hẹn giờ trong tiến trình: tự chạy lịch định kỳ (zero-config, hợp single-instance).
// Tắt bằng ENABLE_SCHEDULER=false (vd. khi tự lên lịch bằng cron ngoài).
let started = false;

export function startSubscriptionScheduler(): void {
  if (started) return;
  started = true;

  const tick = async () => {
    try {
      const { runDueSubscriptions } = await import("@/lib/subscriptions-engine");
      const r = await runDueSubscriptions();
      if (r.created > 0) console.log(`[scheduler] Đã tạo ${r.created} đơn định kỳ (xử lý ${r.processed}).`);
    } catch (e) {
      console.error("[scheduler] lỗi:", e);
    }
  };

  // Chạy lần đầu 1 phút sau khi boot, rồi mỗi 6 giờ.
  setTimeout(tick, 60_000);
  setInterval(tick, 6 * 60 * 60 * 1000);
  console.log("[scheduler] Đã bật bộ hẹn giờ đơn định kỳ (mỗi 6 giờ).");
}
