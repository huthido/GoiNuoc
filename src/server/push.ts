"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import type { ActionResult } from "@/server/orders";

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Lưu (hoặc cập nhật) đăng ký push của user hiện tại. */
export async function subscribePush(sub: PushSubscriptionInput): Promise<ActionResult> {
  const user = await requireUser();
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return { ok: false, error: "Dữ liệu đăng ký không hợp lệ" };
  }
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { userId: user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    update: { userId: user.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
  });
  return { ok: true };
}

/** Hủy đăng ký push theo endpoint. */
export async function unsubscribePush(endpoint: string): Promise<ActionResult> {
  await requireUser();
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return { ok: true };
}
