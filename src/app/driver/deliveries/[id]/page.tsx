import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Phone } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatVND } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { DeliveryActions } from "@/components/driver/DeliveryActions";
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";
import type { OrderStatus, PaymentMethod } from "@/lib/domain/types";

export default async function DeliveryDetail({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser(["DRIVER"]);
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, assignedDriverId: me.id },
    include: { items: true, address: { include: { zone: true } }, customer: true },
  });
  if (!order) notFound();

  const products = await prisma.product.findMany({
    where: { id: { in: order.items.map((i) => i.productId) } },
    select: { id: true, isReturnable: true },
  });
  const returnable = new Set(products.filter((p) => p.isReturnable).map((p) => p.id));
  const returnableQty = order.items.filter((i) => returnable.has(i.productId)).reduce((s, i) => s + i.qty, 0);

  return (
    <div className="space-y-4 p-4">
      <Link href="/driver" className="inline-flex items-center text-sm text-gray-500">
        <ChevronLeft className="h-4 w-4" /> Danh sách giao
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="font-mono text-lg font-bold text-gray-900">{order.code}</h1>
        <StatusBadge status={order.status as OrderStatus} />
      </div>

      {/* Khách + địa chỉ */}
      <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
        <p className="font-semibold text-gray-900">{order.customer.name}</p>
        <a href={`tel:${order.customer.phone}`} className="flex items-center gap-1.5 text-sm text-brand">
          <Phone className="h-4 w-4" /> {order.customer.phone}
        </a>
        {order.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(`${order.address.line} ${order.address.district ?? ""}`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-1.5 text-sm text-gray-600 underline-offset-2 hover:underline"
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            {order.address.line}
            {order.address.district ? `, ${order.address.district}` : ""}
          </a>
        )}
      </div>

      {/* Hàng giao */}
      <div className="space-y-1 rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-1 text-sm font-semibold text-gray-700">Hàng giao</p>
        {order.items.map((it) => (
          <div key={it.id} className="flex justify-between text-sm">
            <span className="text-gray-700">
              {it.nameSnapshot} ×{it.qty}
              {returnable.has(it.productId) && <span className="text-sky-600"> (có vỏ)</span>}
            </span>
            <span className="font-medium">{formatVND(it.lineTotal)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t pt-2 font-bold">
          <span>Thu của khách</span>
          <span className="text-emerald-700">{formatVND(order.total)}</span>
        </div>
        <p className="text-xs text-gray-400">Hình thức: {PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod]}</p>
      </div>

      <DeliveryActions
        orderId={order.id}
        status={order.status as OrderStatus}
        returnableQty={returnableQty}
        defaultCollected={order.paymentMethod !== "DEBT"}
      />
    </div>
  );
}
