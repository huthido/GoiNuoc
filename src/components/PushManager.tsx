"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { subscribePush } from "@/server/push";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function fetchPublicKey(): Promise<string | null> {
  try {
    const res = await fetch("/api/push/vapid-public-key", { cache: "no-store" });
    const data = (await res.json()) as { key: string | null };
    return data.key;
  } catch {
    return null;
  }
}

type Status = "hidden" | "prompt" | "busy";

export function PushManager() {
  const [status, setStatus] = useState<Status>("hidden");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
      if (Notification.permission === "denied") return;
      const key = await fetchPublicKey();
      if (!key) return; // push chưa cấu hình (vd. local) -> ẩn
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing || cancelled) return; // đã đăng ký -> ẩn
      setStatus("prompt");
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setStatus("busy");
    try {
      const key = await fetchPublicKey();
      if (!key) return setStatus("hidden");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setStatus("hidden");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await subscribePush({ endpoint: json.endpoint, keys: json.keys });
      setStatus("hidden");
    } catch {
      setStatus("hidden");
    }
  }

  if (status === "hidden") return null;

  return (
    <div className="flex items-center justify-between gap-2 bg-amber-50 px-4 py-2 text-sm text-amber-800">
      <span className="flex items-center gap-1.5">
        <Bell className="h-4 w-4" /> Bật thông báo cập nhật đơn hàng?
      </span>
      <button
        onClick={enable}
        disabled={status === "busy"}
        className="shrink-0 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
      >
        {status === "busy" ? "Đang bật…" : "Bật"}
      </button>
    </div>
  );
}
