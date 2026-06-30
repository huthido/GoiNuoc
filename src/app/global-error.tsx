"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="vi">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100dvh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Đã xảy ra lỗi</h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Hệ thống đã ghi nhận sự cố.
        </p>
        <button
          onClick={() => reset()}
          style={{
            background: "#0284c7",
            color: "#fff",
            border: 0,
            padding: "8px 20px",
            borderRadius: 12,
            fontWeight: 600,
          }}
        >
          Thử lại
        </button>
      </body>
    </html>
  );
}
