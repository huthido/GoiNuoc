import Link from "next/link";
import { ClipboardList, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { StatusBadge } from "@/components/StatusBadge";
import { formatVND, formatDateTime } from "@/lib/format";
import type { OrderStatus } from "@/lib/domain/types";

export const metadata = { title: "Đơn của tôi · Gọi Nước" };

export default async function OrdersPage() {
  const user = await requireUser(["CUSTOMER"]);
  const orders = await prisma.order.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <ClipboardList className="h-12 w-12 text-gray-300" />
        <p className="text-gray-500">Bạn chưa có đơn nào</p>
        <Link href="/products" className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white">
          Đặt nước ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <h1 className="text-lg font-bold text-gray-900">Đơn của tôi</h1>
      {orders.map((o) => (
        <Link
          key={o.id}
          href={`/orders/${o.code}`}
          className="block rounded-2xl bg-white p-4 shadow-sm active:bg-slate-50"
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-sm font-semibold text-gray-900">{o.code}</span>
            <StatusBadge status={o.status as OrderStatus} />
          </div>
          <p className="truncate text-sm text-gray-500">
            {o.items.map((i) => `${i.nameSnapshot} ×${i.qty}`).join(", ")}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">{formatDateTime(o.createdAt)}</span>
            <span className="flex items-center gap-1 font-bold text-brand">
              {formatVND(o.total)}
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
