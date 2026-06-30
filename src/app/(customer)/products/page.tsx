import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/customer/ProductCard";
import { PRODUCT_TYPE_LABELS } from "@/lib/labels";
import { PRODUCT_TYPES, type ProductType } from "@/lib/domain/types";

export const metadata = { title: "Sản phẩm · Gọi Nước" };

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ type: "asc" }, { price: "asc" }],
  });

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-lg font-bold text-gray-900">Tất cả sản phẩm</h1>
      {PRODUCT_TYPES.map((type) => {
        const group = products.filter((p) => p.type === type);
        if (group.length === 0) return null;
        return (
          <section key={type} className="space-y-3">
            <h2 className="font-semibold text-gray-700">{PRODUCT_TYPE_LABELS[type as ProductType]}</h2>
            <div className="space-y-3">
              {group.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
