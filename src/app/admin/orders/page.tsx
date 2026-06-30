import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatVND, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { ORDER_STATUS_LABELS } from "@/lib/labels";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/domain/types";
import { cn } from "@/lib/cn";

export const metadata = { title: "Đơn hàng · Quản trị" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const valid = status && (ORDER_STATUSES as readonly string[]).includes(status) ? (status as OrderStatus) : undefined;

  const orders = await prisma.order.findMany({
    where: valid ? { status: valid } : {},
    orderBy: { createdAt: "desc" },
    include: { customer: true, driver: true },
    take: 100,
  });

  const chips: { key?: OrderStatus; label: string }[] = [
    { label: "Tất cả" },
    ...ORDER_STATUSES.map((s) => ({ key: s, label: ORDER_STATUS_LABELS[s] })),
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Đơn hàng</h1>

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {chips.map((c) => {
          const href = c.key ? `/admin/orders?status=${c.key}` : "/admin/orders";
          const active = valid === c.key;
          return (
            <Link
              key={c.label}
              href={href}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium",
                active ? "bg-brand text-white" : "bg-white text-gray-600 shadow-sm",
              )}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {orders.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">Không có đơn nào.</p>
        ) : (
          <div className="divide-y">
            {orders.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.code}`} className="flex items-center gap-3 p-3 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-gray-900">{o.code}</span>
                    <StatusBadge status={o.status as OrderStatus} />
                  </div>
                  <p className="truncate text-sm text-gray-500">
                    {o.customer.name}
                    {o.driver ? ` · TX: ${o.driver.name}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatVND(o.total)}</p>
                  <p className="text-[11px] text-gray-400">{formatDateTime(o.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
