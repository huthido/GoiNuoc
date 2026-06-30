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

  const existing = await prisma.pushSubscription.findUnique({ where: { endpoint: sub.endpoint } });
  // Endpoint đã thuộc user khác -> KHÔNG chiếm (tránh hijack/đổi chủ). Coi như xong, không lộ thông tin.
  if (existing && existing.userId !== user.id) {
    return { ok: true };
  }

  if (existing) {
    await prisma.pushSubscription.update({
      where: { endpoint: sub.endpoint },
      data: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
  } else {
    await prisma.pushSubscription.create({
      data: { userId: user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
  }
  return { ok: true };
}

/** Hủy đăng ký push theo endpoint — chỉ xóa subscription CỦA CHÍNH user (tránh IDOR). */
export async function unsubscribePush(endpoint: string): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
  return { ok: true };
}
