import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Truck, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { OrderStatusStepper } from "@/components/OrderStatusStepper";
import { CancelOrderButton } from "@/components/customer/CancelOrderButton";
import { formatVND, formatDateTime } from "@/lib/format";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/labels";
import { canTransition } from "@/lib/domain/orderStatus";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/domain/types";

export default async function OrderDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const user = await requireUser(["CUSTOMER"]);
  const { code } = await params;
  const order = await prisma.order.findFirst({
    where: { code, customerId: user.id },
    include: { items: true, address: true, driver: true },
  });
  if (!order) notFound();

  const cancellable = canTransition(order.status as OrderStatus, "CANCELLED", "CUSTOMER");

  return (
    <div className="space-y-4 p-4">
      <Link href="/orders" className="inline-flex items-center text-sm text-gray-500">
        <ChevronLeft className="h-4 w-4" /> Đơn của tôi
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="font-mono text-lg font-bold text-gray-900">{order.code}</h1>
        <span className="text-xs text-gray-400">{formatDateTime(order.createdAt)}</span>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <OrderStatusStepper status={order.status as OrderStatus} />
      </div>

      {order.driver && (order.status === "ASSIGNED" || order.status === "DELIVERING") && (
        <div className="flex items-center gap-2 rounded-2xl bg-sky-50 p-3 text-sm text-sky-800">
          <Truck className="h-4 w-4" />
          Tài xế <span className="font-semibold">{order.driver.name}</span> đang phụ trách giao đơn này.
        </div>
      )}

      {/* Sản phẩm */}
      <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700">Sản phẩm</p>
        {order.items.map((it) => (
          <div key={it.id} className="flex justify-between text-sm">
            <span className="text-gray-700">
              {it.nameSnapshot} <span className="text-gray-400">×{it.qty}</span>
              {it.returnedEmpties > 0 && <span className="text-emerald-600"> · trả {it.returnedEmpties} vỏ</span>}
            </span>
            <span className="font-medium text-gray-900">{formatVND(it.lineTotal)}</span>
          </div>
        ))}
        <div className="mt-2 space-y-1 border-t pt-2 text-sm">
          <Row label="Tiền hàng" value={formatVND(order.subtotal)} />
          {order.depositTotal > 0 && <Row label="Cọc vỏ" value={formatVND(order.depositTotal)} />}
          <Row label="Phí giao" value={order.shippingFee === 0 ? "Miễn phí" : formatVND(order.shippingFee)} />
          {order.discount > 0 && <Row label="Giảm giá" value={`- ${formatVND(order.discount)}`} />}
          <div className="flex justify-between border-t pt-1 text-base font-bold">
            <span>Tổng cộng</span>
            <span className="text-brand">{formatVND(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Giao & thanh toán */}
      <div className="space-y-2 rounded-2xl bg-white p-4 text-sm shadow-sm">
        {order.address && (
          <p className="flex items-start gap-1.5 text-gray-700">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            {order.address.line}
            {order.address.district ? `, ${order.address.district}` : ""}
          </p>
        )}
        <Row label="Thanh toán" value={PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod]} />
        <Row label="Trạng thái TT" value={PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus]} />
        {order.note && <p className="text-gray-500">Ghi chú: {order.note}</p>}
      </div>

      {cancellable && <CancelOrderButton orderId={order.id} />}
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
