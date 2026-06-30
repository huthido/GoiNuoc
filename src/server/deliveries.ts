"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { assertTransition } from "@/lib/domain/orderStatus";
import { sendPushToUser } from "@/lib/push";
import { completeDeliverySchema, type CompleteDeliveryInput } from "@/lib/validators/order";
import type { OrderStatus } from "@/lib/domain/types";
import type { ActionResult } from "@/server/orders";

/** Tài xế bắt đầu giao (ASSIGNED -> DELIVERING). */
export async function startDelivery(orderId: string): Promise<ActionResult> {
  const user = await requireUser(["DRIVER"]);
  const order = await prisma.order.findFirst({ where: { id: orderId, assignedDriverId: user.id } });
  if (!order) return { ok: false, error: "Không tìm thấy đơn được phân cho bạn" };
  try {
    assertTransition(order.status as OrderStatus, "DELIVERING", "DRIVER");
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  await prisma.order.update({ where: { id: order.id }, data: { status: "DELIVERING" } });
  revalidatePath("/driver");
  revalidatePath(`/driver/deliveries/${order.id}`);
  return { ok: true };
}

/** Tài xế giao hụt (khách vắng...). */
export async function failDelivery(orderId: string): Promise<ActionResult> {
  const user = await requireUser(["DRIVER"]);
  const order = await prisma.order.findFirst({ where: { id: orderId, assignedDriverId: user.id } });
  if (!order) return { ok: false, error: "Không tìm thấy đơn được phân cho bạn" };
  try {
    assertTransition(order.status as OrderStatus, "FAILED", "DRIVER");
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
  revalidatePath("/driver");
  revalidatePath(`/driver/deliveries/${order.id}`);
  return { ok: true };
}

/**
 * Tài xế hoàn tất giao: ghi sổ vỏ + công nợ + tính lại cọc theo số vỏ thu.
 * Toàn bộ trong một transaction để Order/BottleTxn/khách nhất quán.
 */
export async function completeDelivery(input: CompleteDeliveryInput): Promise<ActionResult> {
  const user = await requireUser(["DRIVER"]);
  const parsed = completeDeliverySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const { orderId, emptiesCollected, collected } = parsed.data;

  const order = await prisma.order.findFirst({
    where: { id: orderId, assignedDriverId: user.id },
    include: { items: true, customer: true },
  });
  if (!order) return { ok: false, error: "Không tìm thấy đơn được phân cho bạn" };
  try {
    assertTransition(order.status as OrderStatus, "DELIVERED", "DRIVER");
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: order.items.map((i) => i.productId) } },
    select: { id: true, isReturnable: true },
  });
  const returnable = new Set(products.filter((p) => p.isReturnable).map((p) => p.id));

  const returnableItems = order.items.filter((it) => returnable.has(it.productId));
  const deliveredFull = returnableItems.reduce((s, it) => s + it.qty, 0);

  // Phân bổ vỏ thu (để tính lại cọc) cho từng dòng hàng tuần hoàn, mỗi dòng tối đa = qty.
  let toDistribute = Math.min(emptiesCollected, deliveredFull);
  const itemReturned = new Map<string, number>();
  for (const it of returnableItems) {
    const take = Math.min(toDistribute, it.qty);
    itemReturned.set(it.id, take);
    toDistribute -= take;
    if (toDistribute <= 0) break;
  }

  // Cọc vỏ tính lại = Σ depositPrice × (qty − vỏ trả), sàn 0.
  let depositTotal = 0;
  for (const it of returnableItems) {
    const ret = itemReturned.get(it.id) ?? 0;
    depositTotal += it.depositPrice * Math.max(0, it.qty - ret);
  }
  const total = Math.max(0, order.subtotal + depositTotal + order.shippingFee - order.discount);

  const balanceAfter = order.customer.emptyBottlesHeld + deliveredFull - emptiesCollected;
  const paymentStatus = collected ? "PAID" : "DEBT";

  await prisma.$transaction(async (tx) => {
    for (const it of returnableItems) {
      const ret = itemReturned.get(it.id) ?? 0;
      if (ret !== it.returnedEmpties) {
        await tx.orderItem.update({ where: { id: it.id }, data: { returnedEmpties: ret } });
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
        depositTotal,
        total,
        paymentStatus,
      },
    });

    if (deliveredFull !== 0 || emptiesCollected !== 0) {
      await tx.bottleTxn.create({
        data: {
          customerId: order.customerId,
          orderId: order.id,
          deliveredFull,
          returnedEmpty: emptiesCollected,
          balanceAfter,
          note: `Giao đơn ${order.code}`,
        },
      });
    }

    await tx.user.update({
      where: { id: order.customerId },
      data: {
        emptyBottlesHeld: balanceAfter,
        ...(collected ? {} : { debtBalance: { increment: total } }),
      },
    });

    await tx.notification.create({
      data: {
        userId: order.customerId,
        type: "ORDER",
        title: "Đơn đã giao",
        body: `Đơn ${order.code} đã giao thành công. Cảm ơn bạn!`,
      },
    });
  });

  await sendPushToUser(order.customerId, {
    title: "Đơn đã giao",
    body: `Đơn ${order.code} đã giao thành công. Cảm ơn bạn!`,
    url: `/orders/${order.code}`,
  });

  revalidatePath("/driver");
  revalidatePath(`/driver/deliveries/${order.id}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}
