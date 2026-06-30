import { formatVND } from "@/lib/format";
import { PRODUCT_TYPE_LABELS } from "@/lib/labels";
import type { ProductType } from "@/lib/domain/types";
import { AddToCartButton, type CartProduct } from "@/components/customer/AddToCartButton";

const TYPE_EMOJI: Record<ProductType, string> = {
  BINH_20L: "🪣",
  THUNG_CHAI: "📦",
  CHAI_LE: "🍶",
  KHAC: "💧",
};

export interface ProductCardData extends CartProduct {
  type: string;
  description?: string | null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const type = product.type as ProductType;
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-sky-200 text-3xl">
        {TYPE_EMOJI[type] ?? "💧"}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-[11px] font-medium uppercase tracking-wide text-sky-600">
          {PRODUCT_TYPE_LABELS[type] ?? "Sản phẩm"}
        </p>
        <h3 className="truncate font-semibold text-gray-900">{product.name}</h3>
        <p className="text-sm font-bold text-brand">
          {formatVND(product.price)}
          <span className="font-normal text-gray-400"> / {product.unit}</span>
        </p>
        <div className="mt-auto flex items-center justify-between pt-1">
          {product.isReturnable && product.depositPrice > 0 ? (
            <span className="text-[11px] text-gray-400">Cọc vỏ {formatVND(product.depositPrice)}</span>
          ) : (
            <span />
          )}
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}
