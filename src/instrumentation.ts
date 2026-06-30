import type { Instrumentation } from "next";

// Chạy 1 lần khi server Node khởi động — bật bộ hẹn giờ đơn định kỳ.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.ENABLE_SCHEDULER === "false") return;
  const { startSubscriptionScheduler } = await import("@/lib/scheduler");
  startSubscriptionScheduler();
}

// Bắt MỌI lỗi server (server component, route handler, server action) -> ghi nhật ký.
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  try {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;
    const { logError } = await import("@/lib/error-log");
    await logError(error, {
      source: "request",
      url: request?.path,
      method: request?.method,
      digest: (error as { digest?: string })?.digest,
    });
  } catch {
    // nuốt lỗi để không lặp vô hạn
  }
};
