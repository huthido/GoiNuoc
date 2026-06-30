import { prisma } from "@/lib/db";
import { ProductsManager } from "@/components/admin/ProductsManager";

export const metadata = { title: "Sản phẩm · Quản trị" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ orderBy: [{ isActive: "desc" }, { type: "asc" }, { name: "asc" }] });
  return (
    <ProductsManager
      products={products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        type: p.type,
        unit: p.unit,
        price: p.price,
        depositPrice: p.depositPrice,
        isReturnable: p.isReturnable,
        stock: p.stock,
        isActive: p.isActive,
      }))}
    />
  );
}
