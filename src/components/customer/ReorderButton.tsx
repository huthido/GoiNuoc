"use client";

import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { useCart, type CartItem } from "@/lib/cart-store";

export function ReorderButton({ items }: { items: CartItem[] }) {
  const router = useRouter();
  const replaceAll = useCart((s) => s.replaceAll);

  return (
    <button
      onClick={() => {
        replaceAll(items);
        router.push("/cart");
      }}
      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-brand shadow-sm"
    >
      <RotateCcw className="h-4 w-4" />
      Đặt lại
    </button>
  );
}
