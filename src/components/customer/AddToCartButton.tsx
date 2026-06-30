"use client";

import { Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart-store";

export interface CartProduct {
  id: string;
  name: string;
  unit: string;
  price: number;
  depositPrice: number;
  isReturnable: boolean;
}

export function AddToCartButton({ product }: { product: CartProduct }) {
  const item = useCart((s) => s.items.find((i) => i.productId === product.id));
  const add = useCart((s) => s.add);
  const setQty = useCart((s) => s.setQty);
  const qty = item?.qty ?? 0;

  const base = {
    productId: product.id,
    name: product.name,
    unit: product.unit,
    unitPrice: product.price,
    depositPrice: product.depositPrice,
    isReturnable: product.isReturnable,
  };

  if (qty === 0) {
    return (
      <button
        onClick={() => add(base)}
        className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
      >
        Thêm
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setQty(product.id, qty - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 active:bg-gray-100"
        aria-label="Giảm"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-5 text-center font-semibold">{qty}</span>
      <button
        onClick={() => add(base)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white active:bg-brand-dark"
        aria-label="Tăng"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
