"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { runDueSubscriptionsNow } from "@/server/subscriptions";

export function RunSubscriptionsButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            setMsg(null);
            const r = await runDueSubscriptionsNow();
            if (r.ok) setMsg(`Đã xử lý ${r.data?.processed ?? 0} lịch · tạo ${r.data?.created ?? 0} đơn`);
            router.refresh();
          })
        }
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        <Play className="h-4 w-4" />
        {pending ? "Đang chạy…" : "Chạy đơn đến hạn"}
      </button>
      {msg && <span className="text-sm text-emerald-700">{msg}</span>}
    </div>
  );
}
