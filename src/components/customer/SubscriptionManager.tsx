"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pause, Play, Trash2, CalendarClock } from "lucide-react";
import { createSubscription, toggleSubscription, cancelSubscription } from "@/server/subscriptions";
import { SUBSCRIPTION_FREQUENCY_LABELS } from "@/lib/labels";
import { SUBSCRIPTION_FREQUENCIES, type SubscriptionFrequency } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";

export interface SubItem {
  id: string;
  productName: string;
  qty: number;
  frequency: string;
  nextRunAt: string | null;
  isActive: boolean;
}
export interface SubProduct {
  id: string;
  name: string;
  unit: string;
}
export interface SubAddress {
  id: string;
  label: string;
  line: string;
  isDefault: boolean;
}

export function SubscriptionManager({
  subscriptions,
  products,
  addresses,
}: {
  subscriptions: SubItem[];
  products: SubProduct[];
  addresses: SubAddress[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [showForm, setShowForm] = useState(subscriptions.length === 0);
  const [error, setError] = useState<string | null>(null);

  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [frequency, setFrequency] = useState<SubscriptionFrequency>("WEEKLY");
  const [addressId, setAddressId] = useState(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res.ok) {
        after?.();
        router.refresh();
      } else {
        setError(res.error ?? "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Đặt định kỳ</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" /> Tạo lịch
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Tự động tạo đơn theo lịch (vd. 2 bình mỗi tuần). Đơn sẽ ở trạng thái “Chờ xác nhận” để nhà máy duyệt như thường.
      </p>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      {showForm && (
        <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
          <p className="font-semibold text-gray-900">Lịch định kỳ mới</p>
          <Field label="Sản phẩm">
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className={input}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Số lượng">
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className={input}
              />
            </Field>
            <Field label="Tần suất">
              <select value={frequency} onChange={(e) => setFrequency(e.target.value as SubscriptionFrequency)} className={input}>
                {SUBSCRIPTION_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {SUBSCRIPTION_FREQUENCY_LABELS[f]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {addresses.length > 0 && (
            <Field label="Địa chỉ giao">
              <select value={addressId} onChange={(e) => setAddressId(e.target.value)} className={input}>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} — {a.line}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Bắt đầu từ (để trống = ngay hôm nay)">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={input} />
          </Field>
          <div className="flex gap-2">
            <button
              disabled={pending || !productId}
              onClick={() =>
                run(
                  () =>
                    createSubscription({
                      productId,
                      qty,
                      frequency,
                      addressId: addressId || undefined,
                      startDate: startDate || undefined,
                    }),
                  () => {
                    setShowForm(false);
                    setQty(1);
                    setStartDate("");
                  },
                )
              }
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Đang lưu…" : "Tạo lịch"}
            </button>
            {subscriptions.length > 0 && (
              <button onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-600">
                Hủy
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {subscriptions.map((s) => (
          <div key={s.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">
                  {s.productName} <span className="text-gray-400">×{s.qty}</span>
                </p>
                <p className="text-sm text-gray-500">{SUBSCRIPTION_FREQUENCY_LABELS[s.frequency as SubscriptionFrequency]}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {s.isActive
                    ? s.nextRunAt
                      ? `Kỳ tới: ${formatDate(s.nextRunAt)}`
                      : "Chưa lên lịch"
                    : "Đang tạm dừng"}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"
                }`}
              >
                {s.isActive ? "Đang chạy" : "Tạm dừng"}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                disabled={pending}
                onClick={() => run(() => toggleSubscription(s.id))}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-600 disabled:opacity-60"
              >
                {s.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {s.isActive ? "Tạm dừng" : "Tiếp tục"}
              </button>
              <button
                disabled={pending}
                onClick={() => run(() => cancelSubscription(s.id))}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" /> Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  );
}
