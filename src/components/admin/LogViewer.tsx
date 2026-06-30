"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, ChevronDown, Trash2 } from "lucide-react";
import { resolveLog, clearResolvedLogs, clearAllLogs } from "@/server/logs";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface LogItem {
  id: string;
  level: string;
  source: string | null;
  message: string;
  stack: string | null;
  url: string | null;
  userId: string | null;
  resolved: boolean;
  createdAt: string;
}

const LEVEL_COLOR: Record<string, string> = {
  ERROR: "bg-rose-100 text-rose-700",
  WARN: "bg-amber-100 text-amber-700",
  INFO: "bg-sky-100 text-sky-700",
};

export function LogViewer({
  logs,
  unresolvedCount,
  filter,
}: {
  logs: LogItem[];
  unresolvedCount: number;
  filter?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [openId, setOpenId] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean }>) {
    start(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Nhật ký lỗi</h1>
        <div className="flex gap-2">
          <button
            disabled={pending}
            onClick={() => run(clearResolvedLogs)}
            className="rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-600 disabled:opacity-60"
          >
            Xóa đã xử lý
          </button>
          <button
            disabled={pending}
            onClick={() => {
              if (confirm("Xóa TẤT CẢ nhật ký lỗi?")) run(clearAllLogs);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" /> Xóa tất cả
          </button>
        </div>
      </div>

      <div className="flex gap-2 text-sm">
        <FilterChip
          active={filter !== "unresolved"}
          href="/admin/logs"
          label="Tất cả"
        />
        <FilterChip
          active={filter === "unresolved"}
          href="/admin/logs?filter=unresolved"
          label={`Chưa xử lý (${unresolvedCount})`}
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {logs.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">
            Không có lỗi nào. 🎉
          </p>
        ) : (
          <div className="divide-y">
            {logs.map((log) => (
              <div
                key={log.id}
                className={cn("p-3", log.resolved && "opacity-60")}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-0.5 rounded px-1.5 py-0.5 text-[11px] font-bold",
                      LEVEL_COLOR[log.level] ?? "bg-gray-100 text-gray-600",
                    )}
                  >
                    {log.level}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-medium text-gray-900">
                      {log.message}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDateTime(log.createdAt)}
                      {log.source ? ` · ${log.source}` : ""}
                      {log.url ? ` · ${log.url}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {log.stack && (
                      <button
                        onClick={() =>
                          setOpenId(openId === log.id ? null : log.id)
                        }
                        className="rounded p-1.5 text-gray-400 hover:bg-slate-100"
                        aria-label="Chi tiết"
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition",
                            openId === log.id && "rotate-180",
                          )}
                        />
                      </button>
                    )}
                    <button
                      disabled={pending}
                      onClick={() => run(() => resolveLog(log.id))}
                      className={cn(
                        "rounded p-1.5 disabled:opacity-60",
                        log.resolved
                          ? "text-amber-500 hover:bg-amber-50"
                          : "text-emerald-500 hover:bg-emerald-50",
                      )}
                      aria-label={log.resolved ? "Mở lại" : "Đánh dấu đã xử lý"}
                    >
                      {log.resolved ? (
                        <RotateCcw className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {openId === log.id && log.stack && (
                  <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-200">
                    {log.stack}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1.5 font-medium",
        active ? "bg-brand text-white" : "bg-white text-gray-600 shadow-sm",
      )}
    >
      {label}
    </Link>
  );
}
