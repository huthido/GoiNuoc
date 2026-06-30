"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    fetch("/api/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        url: typeof window !== "undefined" ? window.location.href : "",
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="text-5xl">⚠️</div>
      <h1 className="text-xl font-semibold text-gray-900">Đã xảy ra lỗi</h1>
      <p className="max-w-sm text-sm text-gray-500">
        Hệ thống đã ghi nhận sự cố. Vui lòng thử lại.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-xl bg-brand px-5 py-2 font-semibold text-white"
      >
        Thử lại
      </button>
    </div>
  );
}
