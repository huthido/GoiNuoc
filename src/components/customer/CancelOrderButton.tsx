"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelMyOrder } from "@/server/orders";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full rounded-xl border border-rose-200 py-2.5 text-sm font-semibold text-rose-600"
      >
        Hủy đơn
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <p className="text-center text-sm text-gray-600">Bạn chắc chắn muốn hủy đơn này?</p>
      <div className="flex gap-2">
        <button
          onClick={() => setConfirming(false)}
          className="flex-1 rounded-xl border py-2.5 text-sm font-semibold text-gray-600"
        >
          Không
        </button>
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await cancelMyOrder(orderId);
              if (res.ok) router.refresh();
              else setError(res.error);
            })
          }
          className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Đang hủy…" : "Hủy đơn"}
        </button>
      </div>
    </div>
  );
}
