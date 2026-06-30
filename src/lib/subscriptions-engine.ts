// Engine định kỳ: tìm lịch đến hạn -> tạo đơn -> dời nextRunAt. KHÔNG auth (chạy bởi cron/scheduler/admin).
import { prisma } from "@/lib/db";
import { createOrderForCustomer } from "@/lib/orders";
import { advanceUntilFuture } from "@/lib/domain/subscription";
import { sendPushToUser } from "@/lib/push";
import type { SubscriptionFrequency } from "@/lib/domain/types";

export interface RunResult {
  processed: number;
  created: number;
  skipped: number;
}

let running = false;

export async function runDueSubscriptions(now: Date = new Date()): Promise<RunResult> {
  if (running) return { processed: 0, created: 0, skipped: 0 };
  running = true;
  try {
    const due = await prisma.subscription.findMany({
      where: { isActive: true, nextRunAt: { lte: now } },
      include: { customer: { include: { addresses: true } }, product: true },
    });

    let created = 0;
    let skipped = 0;

    for (const sub of due) {
      const addressId =
        sub.addressId ??
        sub.customer.addresses.find((a) => a.isDefault)?.id ??
        sub.customer.addresses[0]?.id;

      if (addressId && sub.product.isActive) {
        const res = await createOrderForCustomer({
          customerId: sub.customerId,
          addressId,
          items: [{ productId: sub.productId, qty: sub.qty }],
          paymentMethod: "COD",
          note: "Đơn đặt định kỳ",
        });
        if (res.ok) {
          created++;
          await sendPushToUser(sub.customerId, {
            title: "Đơn định kỳ đã tạo",
            body: `Đơn ${res.code} (${sub.product.name} ×${sub.qty}) đã được tạo tự động.`,
            url: `/orders/${res.code}`,
          });
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }

      // Luôn dời lịch để không kẹt ở quá khứ.
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { nextRunAt: advanceUntilFuture(sub.nextRunAt!, sub.frequency as SubscriptionFrequency, now) },
      });
    }

    return { processed: due.length, created, skipped };
  } finally {
    running = false;
  }
}
