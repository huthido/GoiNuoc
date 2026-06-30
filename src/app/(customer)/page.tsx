import Link from "next/link";
import { ChevronRight, Droplets, Wallet, CalendarClock } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatVND } from "@/lib/format";
import { ProductCard } from "@/components/customer/ProductCard";
import { ReorderButton } from "@/components/customer/ReorderButton";
import type { CartItem } from "@/lib/cart-store";

export default async function CustomerHome() {
  const sessionUser = await requireUser(["CUSTOMER"]);
  const [user, featured, lastOrder] = await Promise.all([
    prisma.user.findUnique({ where: { id: sessionUser.id } }),
    prisma.product.findMany({ where: { isActive: true, type: "BINH_20L" }, take: 4, orderBy: { price: "asc" } }),
    prisma.order.findFirst({
      where: { customerId: sessionUser.id, status: "DELIVERED" },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
  ]);

  let reorderItems: CartItem[] = [];
  if (lastOrder) {
    const prods = await prisma.product.findMany({ where: { id: { in: lastOrder.items.map((i) => i.productId) } } });
    const pm = new Map(prods.map((p) => [p.id, p]));
    reorderItems = lastOrder.items.map((it) => ({
      productId: it.productId,
      name: it.nameSnapshot,
      unit: pm.get(it.productId)?.unit ?? "cái",
      unitPrice: it.unitPrice,
      depositPrice: it.depositPrice,
      isReturnable: pm.get(it.productId)?.isReturnable ?? false,
      qty: it.qty,
    }));
  }

  return (
    <div className="space-y-5 p-4">
      {/* Tổng quan vỏ + công nợ */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-1.5 text-sky-600">
            <Droplets className="h-4 w-4" />
            <span className="text-xs font-medium">Vỏ đang giữ</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{user?.emptyBottlesHeld ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-1.5 text-amber-600">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-medium">Công nợ</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatVND(user?.debtBalance ?? 0)}</p>
        </div>
      </div>

      {/* Đặt định kỳ */}
      <Link
        href="/subscriptions"
        className="flex items-center justify-between rounded-2xl bg-white p-3.5 shadow-sm active:bg-slate-50"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <CalendarClock className="h-5 w-5 text-brand" /> Đặt định kỳ — giao tự động theo lịch
        </span>
        <ChevronRight className="h-4 w-4 text-gray-300" />
      </Link>

      {/* Đặt lại đơn gần nhất */}
      {reorderItems.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand to-sky-500 p-4 text-white shadow-sm">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Đặt lại đơn gần nhất</p>
            <p className="truncate text-xs text-sky-100">
              {lastOrder!.code} · {reorderItems.map((i) => `${i.name} ×${i.qty}`).join(", ")}
            </p>
          </div>
          <ReorderButton items={reorderItems} />
        </div>
      )}

      {/* Bình 20L phổ biến */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Bình 20L phổ biến</h2>
          <Link href="/products" className="flex items-center text-sm text-brand">
            Tất cả <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
