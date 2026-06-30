import { prisma } from "@/lib/db";

export interface LogMeta {
  level?: "ERROR" | "WARN" | "INFO";
  source?: string; // request | client | scheduler | cron | action
  url?: string;
  method?: string;
  userId?: string;
  digest?: string;
  stack?: string | null;
}

/** Ghi lỗi vào DB. KHÔNG BAO GIỜ ném (logger không được làm sập luồng chính). */
export async function logError(
  error: unknown,
  meta: LogMeta = {},
): Promise<void> {
  try {
    const message = error instanceof Error ? error.message : String(error);
    const stack =
      meta.stack ?? (error instanceof Error ? (error.stack ?? null) : null);
    await prisma.errorLog.create({
      data: {
        level: meta.level ?? "ERROR",
        source: meta.source ?? null,
        message: message.slice(0, 2000) || "(không có thông điệp)",
        stack: stack ? stack.slice(0, 8000) : null,
        digest: meta.digest ?? null,
        url: meta.url ?? null,
        method: meta.method ?? null,
        userId: meta.userId ?? null,
      },
    });
  } catch (e) {
    console.error("[logError] không ghi được nhật ký lỗi:", e);
  }
}
