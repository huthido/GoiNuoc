"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { checkoutSchema, type CheckoutInput } from "@/lib/validators/order";
import { priceOrder, type PricingLine } from "@/lib/domain/pricing";
import { assertTransition } from "@/lib/domain/orderStatus";
import type { OrderStatus } from "@/lib/domain/types";

export type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

async function nextOrderCode(): Promise<string> {
  const n = await prisma.order.count();
  return "GN" + String(n + 1).padStart(4, "0");
}

/** Khách tạo đơn mới (PENDING). Giá tính lại từ DB, không tin client. */
export async function createOrder(input: CheckoutInput): Promise<ActionResult<{ code: string }>> {
  const user = await requireUser(["CUSTOMER"]);
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const data = parsed.data;

  const address = await prisma.address.findFirst({
    where: { id: data.addressId, userId: user.id },
    include: { zone: true },
  });
  if (!address) return { ok: false, error: "Địa chỉ giao không hợp lệ" };

  const products = await prisma.product.findMany({
    where: { id: { in: data.items.map((i) => i.productId) }, isActive: true },
  });
  const pMap = new Map(products.map((p) => [p.id, p]));

  const lines: PricingLine[] = [];
  const itemRows = [] as {
    productId: string;
    nameSnapshot: string;
    unitPrice: number;
    depositPrice: number;
    qty: number;
    returnedEmpties: number;
    lineTotal: number;
  }[];

  for (const it of data.items) {
    const p = pMap.get(it.productId);
    if (!p) return { ok: false, error: "Có sản phẩm không còn khả dụng" };
    lines.push({ unitPrice: p.price, qty: it.qty, depositPrice: p.depositPrice, isReturnable: p.isReturnable });
    itemRows.push({
      productId: p.id,
      nameSnapshot: p.name,
      unitPrice: p.price,
      depositPrice: p.depositPrice,
      qty: it.qty,
      returnedEmpties: 0,
      lineTotal: p.price * it.qty,
    });
  }

  const priced = priceOrder({
    lines,
    shippingFee: address.zone?.shippingFee ?? 0,
    freeShipThreshold: address.zone?.freeShipThreshold ?? 0,
  });

  const order = await prisma.order.create({
    data: {
      code: await nextOrderCode(),
      customerId: user.id,
      addressId: address.id,
      status: "PENDING",
      paymentMethod: data.paymentMethod,
      paymentStatus: "UNPAID",
      subtotal: priced.subtotal,
      shippingFee: priced.shippingFee,
      depositTotal: priced.depositTotal,
      discount: priced.discount,
      total: priced.total,
      note: data.note ?? null,
      items: { create: itemRows },
    },
  });

  // Thông báo cho nhân viên (admin/staff) — đơn giản: 1 thông báo tới tất cả admin.
  const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "STAFF"] } }, select: { id: true } });
  if (admins.length) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: "ORDER",
        title: "Đơn mới",
        body: `Đơn ${order.code} vừa được đặt.`,
      })),
    });
  }

  revalidatePath("/orders");
  revalidatePath("/admin/orders");
  return { ok: true, data: { code: order.code } };
}

/** Khách tự hủy đơn khi còn PENDING/CONFIRMED. */
export async function cancelMyOrder(orderId: string): Promise<ActionResult> {
  const user = await requireUser(["CUSTOMER"]);
  const order = await prisma.order.findFirst({ where: { id: orderId, customerId: user.id } });
  if (!order) return { ok: false, error: "Không tìm thấy đơn" };
  try {
    assertTransition(order.status as OrderStatus, "CANCELLED", "CUSTOMER");
  } catch {
    return { ok: false, error: "Đơn không thể hủy ở trạng thái hiện tại" };
  }
  await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
  revalidatePath("/orders");
  revalidatePath(`/orders/${order.code}`);
  return { ok: true };
}
