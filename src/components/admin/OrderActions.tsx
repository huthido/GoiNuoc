"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmOrder, assignDriver, cancelOrderAdmin } from "@/server/admin";
import type { OrderStatus } from "@/lib/domain/types";

interface Props {
  orderId: string;
  status: OrderStatus;
  drivers: { id: string; name: string }[];
  assignedDriverName?: string | null;
}

export function OrderActions({ orderId, status, drivers, assignedDriverName }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? "");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else setError(res.error ?? "Có lỗi xảy ra");
    });
  }

  return (
    <div className="space-y-3">
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      {status === "PENDING" && (
        <div className="flex gap-2">
          <button
            disabled={pending}
            onClick={() => run(() => confirmOrder(orderId))}
            className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Xác nhận đơn
          </button>
          <button
            disabled={pending}
            onClick={() => run(() => cancelOrderAdmin(orderId))}
            className="rounded-lg border border-rose-200 px-4 text-sm font-semibold text-rose-600 disabled:opacity-60"
          >
            Hủy
          </button>
        </div>
      )}

      {status === "CONFIRMED" && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Phân tài xế giao</label>
          <div className="flex gap-2">
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <button
              disabled={pending || !driverId}
              onClick={() => run(() => assignDriver(orderId, driverId))}
              className="rounded-lg bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              Phân giao
            </button>
          </div>
          <button
            disabled={pending}
            onClick={() => run(() => cancelOrderAdmin(orderId))}
            className="text-sm text-rose-600"
          >
            Hủy đơn
          </button>
        </div>
      )}

      {(status === "ASSIGNED" || status === "DELIVERING") && (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">
          Đang giao bởi <span className="font-semibold">{assignedDriverName ?? "tài xế"}</span>.
        </p>
      )}
    </div>
  );
}
