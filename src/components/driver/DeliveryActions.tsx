"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startDelivery, completeDelivery, failDelivery } from "@/server/deliveries";
import type { OrderStatus } from "@/lib/domain/types";

interface Props {
  orderId: string;
  status: OrderStatus;
  returnableQty: number; // số bình tuần hoàn trong đơn (gợi ý tối đa vỏ thu)
  defaultCollected: boolean;
}

export function DeliveryActions({ orderId, status, returnableQty, defaultCollected }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [empties, setEmpties] = useState(0);
  const [collected, setCollected] = useState(defaultCollected);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else setError(res.error ?? "Có lỗi xảy ra");
    });
  }

  if (status === "DELIVERED") {
    return <p className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">Đã giao xong ✓</p>;
  }
  if (status === "FAILED") {
    return <p className="rounded-xl bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-700">Đơn giao hụt</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      {status === "ASSIGNED" && (
        <>
          <button
            disabled={pending}
            onClick={() => run(() => startDelivery(orderId))}
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white disabled:opacity-60"
          >
            Bắt đầu giao
          </button>
          <button
            disabled={pending}
            onClick={() => run(() => failDelivery(orderId))}
            className="w-full rounded-xl border border-rose-200 py-2.5 text-sm font-semibold text-rose-600 disabled:opacity-60"
          >
            Giao hụt (khách vắng…)
          </button>
        </>
      )}

      {status === "DELIVERING" && (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          {returnableQty > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Số vỏ thu về (giao {returnableQty} bình)
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEmpties((v) => Math.max(0, v - 1))}
                  className="h-10 w-10 rounded-lg border text-lg font-bold text-gray-600"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  value={empties}
                  onChange={(e) => setEmpties(Math.max(0, Number(e.target.value)))}
                  className="w-16 rounded-lg border border-gray-300 py-2 text-center"
                />
                <button
                  onClick={() => setEmpties((v) => v + 1)}
                  className="h-10 w-10 rounded-lg border text-lg font-bold text-gray-600"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div>
            <p className="mb-1 text-sm font-medium text-gray-700">Thanh toán</p>
            <div className="flex gap-2">
              <button
                onClick={() => setCollected(true)}
                className={`flex-1 rounded-lg border py-2 text-sm font-semibold ${collected ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "text-gray-500"}`}
              >
                Đã thu tiền
              </button>
              <button
                onClick={() => setCollected(false)}
                className={`flex-1 rounded-lg border py-2 text-sm font-semibold ${!collected ? "border-amber-500 bg-amber-50 text-amber-700" : "text-gray-500"}`}
              >
                Ghi nợ
              </button>
            </div>
          </div>

          <button
            disabled={pending}
            onClick={() => run(() => completeDelivery({ orderId, emptiesCollected: empties, collected }))}
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Đang lưu…" : "Hoàn tất giao"}
          </button>
          <button
            disabled={pending}
            onClick={() => run(() => failDelivery(orderId))}
            className="w-full text-sm font-semibold text-rose-600 disabled:opacity-60"
          >
            Giao hụt
          </button>
        </div>
      )}
    </div>
  );
}
