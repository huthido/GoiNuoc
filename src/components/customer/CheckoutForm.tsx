"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ShoppingCart } from "lucide-react";
import { useCart, cartSubtotal } from "@/lib/cart-store";
import { priceOrder } from "@/lib/domain/pricing";
import { createOrder } from "@/server/orders";
import { formatVND } from "@/lib/format";
import type { PaymentMethod } from "@/lib/domain/types";

export interface CheckoutAddress {
  id: string;
  label: string;
  line: string;
  district: string | null;
  isDefault: boolean;
  zone: { shippingFee: number; freeShipThreshold: number } | null;
}

export function CheckoutForm({ addresses, canDebt }: { addresses: CheckoutAddress[]; canDebt: boolean }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);

  const [addressId, setAddressId] = useState(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "");
  const [payment, setPayment] = useState<PaymentMethod>("COD");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <ShoppingCart className="h-12 w-12 text-gray-300" />
        <p className="text-gray-500">Giỏ hàng trống</p>
        <Link href="/products" className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white">
          Chọn sản phẩm
        </Link>
      </div>
    );
  }

  if (addresses.length === 0) {
    return <p className="p-6 text-center text-gray-500">Bạn chưa có địa chỉ giao. Vui lòng liên hệ nhà máy để thêm địa chỉ.</p>;
  }

  const addr = addresses.find((a) => a.id === addressId);
  const priced = priceOrder({
    lines: items.map((i) => ({ unitPrice: i.unitPrice, qty: i.qty, depositPrice: i.depositPrice, isReturnable: i.isReturnable })),
    shippingFee: addr?.zone?.shippingFee ?? 0,
    freeShipThreshold: addr?.zone?.freeShipThreshold ?? 0,
  });

  const methods: { value: PaymentMethod; label: string }[] = [
    { value: "COD", label: "Tiền mặt khi nhận" },
    { value: "BANK", label: "Chuyển khoản" },
    ...(canDebt ? [{ value: "DEBT" as PaymentMethod, label: "Ghi nợ (cuối kỳ)" }] : []),
  ];

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await createOrder({
      addressId,
      paymentMethod: payment,
      note: note.trim() || undefined,
      items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
    });
    if (res.ok) {
      clear();
      router.push(`/orders/${res.data!.code}`);
    } else {
      setError(res.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-bold text-gray-900">Đặt hàng</h1>

      {/* Địa chỉ */}
      <section className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <MapPin className="h-4 w-4 text-brand" /> Địa chỉ giao
        </p>
        {addresses.map((a) => (
          <label key={a.id} className="flex cursor-pointer items-start gap-2 rounded-xl border p-2.5 has-[:checked]:border-brand has-[:checked]:bg-sky-50">
            <input
              type="radio"
              name="address"
              checked={addressId === a.id}
              onChange={() => setAddressId(a.id)}
              className="mt-1 accent-sky-600"
            />
            <span className="text-sm">
              <span className="font-medium text-gray-900">{a.label}</span>
              <span className="block text-gray-500">
                {a.line}
                {a.district ? `, ${a.district}` : ""}
              </span>
            </span>
          </label>
        ))}
      </section>

      {/* Thanh toán */}
      <section className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700">Hình thức thanh toán</p>
        {methods.map((m) => (
          <label key={m.value} className="flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 has-[:checked]:border-brand has-[:checked]:bg-sky-50">
            <input
              type="radio"
              name="payment"
              checked={payment === m.value}
              onChange={() => setPayment(m.value)}
              className="accent-sky-600"
            />
            <span className="text-sm text-gray-800">{m.label}</span>
          </label>
        ))}
      </section>

      {/* Ghi chú */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-gray-700">Ghi chú</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Vd: giao giờ hành chính, gọi trước khi tới…"
          className="w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-brand"
        />
      </section>

      {/* Tổng kết */}
      <section className="space-y-1 rounded-2xl bg-white p-4 text-sm shadow-sm">
        <Row label="Tiền hàng" value={formatVND(priced.subtotal)} />
        {priced.depositTotal > 0 && <Row label="Cọc vỏ" value={formatVND(priced.depositTotal)} />}
        <Row label="Phí giao" value={priced.shippingFee === 0 ? "Miễn phí" : formatVND(priced.shippingFee)} />
        <div className="mt-1 flex justify-between border-t pt-2 text-base font-bold">
          <span>Tổng cộng</span>
          <span className="text-brand">{formatVND(priced.total)}</span>
        </div>
      </section>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <button
        onClick={submit}
        disabled={submitting || !addressId}
        className="w-full rounded-xl bg-brand py-3 font-semibold text-white shadow-sm disabled:opacity-60"
      >
        {submitting ? "Đang đặt…" : `Xác nhận đặt hàng · ${formatVND(priced.total)}`}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
