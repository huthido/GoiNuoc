import Link from "next/link";
import { MapPin, ChevronRight, PackageCheck, UserPlus } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatVND } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";
import type { OrderStatus, PaymentMethod } from "@/lib/domain/types";

export const metadata = { title: "Đơn giao · Tài xế" };

export default async function DriverHome() {
  const me = await requireUser(["DRIVER"]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [orders, deliveredToday] = await Promise.all([
    prisma.order.findMany({
      where: { assignedDriverId: me.id, status: { in: ["ASSIGNED", "DELIVERING"] } },
      orderBy: [{ status: "desc" }, { createdAt: "asc" }],
      include: { customer: true, address: true },
    }),
    prisma.order.count({
      where: { assignedDriverId: me.id, status: "DELIVERED", deliveredAt: { gte: startOfToday } },
    }),
  ]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Cần giao hôm nay</h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
          <PackageCheck className="h-4 w-4" /> Đã giao {deliveredToday}
        </span>
      </div>

      <Link
        href="/driver/new-customer"
        className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-emerald-300 bg-white py-2.5 text-sm font-semibold text-emerald-700"
      >
        <UserPlus className="h-4 w-4" /> Thêm khách mới
      </Link>

      {orders.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-gray-400 shadow-sm">
          Không có đơn nào cần giao. 🎉
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/driver/deliveries/${o.id}`}
              className="block rounded-2xl bg-white p-4 shadow-sm active:bg-slate-50"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-gray-900">{o.code}</span>
                <StatusBadge status={o.status as OrderStatus} />
              </div>
              <p className="font-medium text-gray-900">{o.customer.name}</p>
              {o.address && (
                <p className="flex items-start gap-1 text-sm text-gray-500">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {o.address.line}
                  {o.address.district ? `, ${o.address.district}` : ""}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {PAYMENT_METHOD_LABELS[o.paymentMethod as PaymentMethod]} · {formatVND(o.total)}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
