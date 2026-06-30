"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { runDueSubscriptions } from "@/lib/subscriptions-engine";
import { SUBSCRIPTION_FREQUENCIES } from "@/lib/domain/types";
import type { ActionResult } from "@/server/orders";

export interface CreateSubscriptionInput {
  productId: string;
  qty: number;
  frequency: string;
  addressId?: string;
  startDate?: string; // yyyy-mm-dd
}

export async function createSubscription(input: CreateSubscriptionInput): Promise<ActionResult> {
  const user = await requireUser(["CUSTOMER"]);
  const qty = Math.max(1, Math.round(input.qty || 1));
  if (!(SUBSCRIPTION_FREQUENCIES as readonly string[]).includes(input.frequency)) {
    return { ok: false, error: "Tần suất không hợp lệ" };
  }
  const product = await prisma.product.findFirst({ where: { id: input.productId, isActive: true } });
  if (!product) return { ok: false, error: "Sản phẩm không khả dụng" };

  let addressId = input.addressId;
  if (addressId) {
    const addr = await prisma.address.findFirst({ where: { id: addressId, userId: user.id } });
    if (!addr) return { ok: false, error: "Địa chỉ không hợp lệ" };
  } else {
    addressId = (await prisma.address.findFirst({ where: { userId: user.id }, orderBy: { isDefault: "desc" } }))?.id;
  }

  let nextRunAt = new Date();
  if (input.startDate) {
    const d = new Date(input.startDate);
    if (!isNaN(d.getTime())) nextRunAt = d;
  }

  await prisma.subscription.create({
    data: {
      customerId: user.id,
      productId: product.id,
      qty,
      frequency: input.frequency,
      addressId: addressId ?? null,
      nextRunAt,
      isActive: true,
    },
  });
  revalidatePath("/subscriptions");
  return { ok: true };
}

export async function toggleSubscription(id: string): Promise<ActionResult> {
  const user = await requireUser(["CUSTOMER"]);
  const sub = await prisma.subscription.findFirst({ where: { id, customerId: user.id } });
  if (!sub) return { ok: false, error: "Không tìm thấy lịch" };
  await prisma.subscription.update({ where: { id: sub.id }, data: { isActive: !sub.isActive } });
  revalidatePath("/subscriptions");
  return { ok: true };
}

export async function cancelSubscription(id: string): Promise<ActionResult> {
  const user = await requireUser(["CUSTOMER"]);
  const sub = await prisma.subscription.findFirst({ where: { id, customerId: user.id } });
  if (!sub) return { ok: false, error: "Không tìm thấy lịch" };
  await prisma.subscription.delete({ where: { id: sub.id } });
  revalidatePath("/subscriptions");
  return { ok: true };
}

/** Admin chạy tay các lịch đến hạn (ngoài lịch tự động). */
export async function runDueSubscriptionsNow(): Promise<ActionResult<{ created: number; processed: number }>> {
  await requireUser(["ADMIN", "STAFF"]);
  const r = await runDueSubscriptions();
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true, data: { created: r.created, processed: r.processed } };
}
