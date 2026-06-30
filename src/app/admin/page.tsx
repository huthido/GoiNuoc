import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatVND, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/domain/types";

export const metadata = { title: "Tổng quan · Quản trị" };

export default async function AdminDashboard() {
  const [grouped, revenue, debtAgg, bottlesAgg, recent] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED" } }),
    prisma.user.aggregate({ _sum: { debtBalance: true }, where: { role: "CUSTOMER" } }),
    prisma.user.aggregate({ _sum: { emptyBottlesHeld: true }, where: { role: "CUSTOMER" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { customer: true } }),
  ]);

  const countOf = (s: OrderStatus) => grouped.find((g) => g.status === s)?._count._all ?? 0;
  const activeCount = countOf("PENDING") + countOf("CONFIRMED") + countOf("ASSIGNED") + countOf("DELIVERING");

  const stats = [
    { label: "Đơn đang xử lý", value: String(activeCount), sub: `${countOf("PENDING")} chờ xác nhận` },
    { label: "Đã giao", value: String(countOf("DELIVERED")), sub: "tổng số đơn" },
    { label: "Doanh thu đã giao", value: formatVND(revenue._sum.total ?? 0), sub: "" },
    { label: "Công nợ khách", value: formatVND(debtAgg._sum.debtBalance ?? 0), sub: "" },
    { label: "Vỏ đang lưu hành", value: String(bottlesAgg._sum.emptyBottlesHeld ?? 0), sub: "khách đang giữ" },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Tổng quan</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{s.value}</p>
            {s.sub && <p className="text-[11px] text-gray-400">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Đơn gần đây</h2>
          <Link href="/admin/orders" className="text-sm text-brand">
            Xem tất cả
          </Link>
        </div>
        <div className="divide-y">
          {recent.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.code}`}
              className="flex items-center justify-between py-2.5 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <span className="font-mono text-sm font-semibold text-gray-900">{o.code}</span>
                <span className="ml-2 text-sm text-gray-500">{o.customer.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-gray-400 sm:inline">{formatDateTime(o.createdAt)}</span>
                <span className="text-sm font-semibold text-gray-900">{formatVND(o.total)}</span>
                <StatusBadge status={o.status as OrderStatus} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
