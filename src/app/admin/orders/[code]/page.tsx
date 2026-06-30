import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Phone } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatVND, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { OrderActions } from "@/components/admin/OrderActions";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/labels";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/domain/types";

export default async function AdminOrderDetail({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [order, drivers] = await Promise.all([
    prisma.order.findUnique({
      where: { code },
      include: { items: true, address: { include: { zone: true } }, customer: true, driver: true },
    }),
    prisma.user.findMany({ where: { roles: { contains: "DRIVER" }, isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!order) notFound();

  return (
    <div className="space-y-4">
      <Link href="/admin/orders" className="inline-flex items-center text-sm text-gray-500">
        <ChevronLeft className="h-4 w-4" /> Đơn hàng
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-mono text-xl font-bold text-gray-900">{order.code}</h1>
          <StatusBadge status={order.status as OrderStatus} />
        </div>
        <span className="text-xs text-gray-400">{formatDateTime(order.createdAt)}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-semibold text-gray-700">Sản phẩm</p>
            {order.items.map((it) => (
              <div key={it.id} className="flex justify-between py-1 text-sm">
                <span className="text-gray-700">
                  {it.nameSnapshot} ×{it.qty}
                  {it.returnedEmpties > 0 && <span className="text-emerald-600"> · trả {it.returnedEmpties} vỏ</span>}
                </span>
                <span className="font-medium">{formatVND(it.lineTotal)}</span>
              </div>
            ))}
            <div className="mt-2 space-y-1 border-t pt-2 text-sm">
              <Row label="Tiền hàng" value={formatVND(order.subtotal)} />
              {order.depositTotal > 0 && <Row label="Cọc vỏ" value={formatVND(order.depositTotal)} />}
              <Row label="Phí giao" value={order.shippingFee === 0 ? "Miễn phí" : formatVND(order.shippingFee)} />
              <div className="flex justify-between border-t pt-1 text-base font-bold">
                <span>Tổng cộng</span>
                <span className="text-brand">{formatVND(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-semibold text-gray-700">Thao tác</p>
            <OrderActions
              orderId={order.id}
              status={order.status as OrderStatus}
              drivers={drivers}
              assignedDriverName={order.driver?.name}
            />
          </div>
        </div>

        <div className="space-y-2 rounded-xl bg-white p-4 text-sm shadow-sm">
          <p className="font-semibold text-gray-700">Khách hàng</p>
          <p className="text-gray-900">{order.customer.name}</p>
          <p className="flex items-center gap-1 text-gray-500">
            <Phone className="h-3.5 w-3.5" /> {order.customer.phone}
          </p>
          {order.address && (
            <p className="flex items-start gap-1.5 text-gray-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              {order.address.line}
              {order.address.district ? `, ${order.address.district}` : ""}
              {order.address.zone ? ` (${order.address.zone.name})` : ""}
            </p>
          )}
          <div className="border-t pt-2">
            <Row label="Thanh toán" value={PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod]} />
            <Row label="Trạng thái TT" value={PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus]} />
          </div>
          {order.note && <p className="text-gray-500">Ghi chú: {order.note}</p>}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
