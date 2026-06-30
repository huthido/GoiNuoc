"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useCart, cartSubtotal } from "@/lib/cart-store";
import { formatVND } from "@/lib/format";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <ShoppingCart className="h-12 w-12 text-gray-300" />
        <p className="text-gray-500">Giỏ hàng đang trống</p>
        <Link href="/products" className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white">
          Chọn sản phẩm
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  const depositEst = items.reduce((s, i) => (i.isReturnable ? s + i.depositPrice * i.qty : s), 0);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-bold text-gray-900">Giỏ hàng</h1>

      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.productId} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-100 text-2xl">💧</div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-gray-900">{i.name}</p>
              <p className="text-sm text-brand">{formatVND(i.unitPrice)}</p>
              {i.isReturnable && i.depositPrice > 0 && (
                <p className="text-[11px] text-gray-400">+ cọc vỏ {formatVND(i.depositPrice)}/{i.unit}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty(i.productId, i.qty - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-5 text-center font-semibold">{i.qty}</span>
              <button
                onClick={() => setQty(i.productId, i.qty + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button onClick={() => remove(i.productId)} className="text-gray-300 hover:text-rose-500" aria-label="Xóa">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-1 rounded-2xl bg-white p-4 shadow-sm text-sm">
        <Row label="Tiền hàng" value={formatVND(subtotal)} />
        {depositEst > 0 && <Row label="Cọc vỏ (tạm tính)" value={formatVND(depositEst)} />}
        <p className="pt-1 text-xs text-gray-400">Phí giao và cọc vỏ cuối cùng tính ở bước đặt hàng.</p>
      </div>

      <Link
        href="/checkout"
        className="block rounded-xl bg-brand py-3 text-center font-semibold text-white shadow-sm"
      >
        Tiến hành đặt hàng · {formatVND(subtotal + depositEst)}
      </Link>
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
