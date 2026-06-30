import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { SUBSCRIPTION_FREQUENCY_LABELS } from "@/lib/labels";
import { RunSubscriptionsButton } from "@/components/admin/RunSubscriptionsButton";
import type { SubscriptionFrequency } from "@/lib/domain/types";

export const metadata = { title: "Đặt định kỳ · Quản trị" };

export default async function AdminSubscriptionsPage() {
  const subs = await prisma.subscription.findMany({
    include: { customer: true, product: true },
    orderBy: [{ isActive: "desc" }, { nextRunAt: "asc" }],
  });
  const activeCount = subs.filter((s) => s.isActive).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Đặt định kỳ</h1>
        <RunSubscriptionsButton />
      </div>
      <p className="text-sm text-gray-500">
        {activeCount} lịch đang chạy · tổng {subs.length}. Đơn định kỳ tự sinh khi đến hạn (bộ hẹn giờ chạy mỗi 6 giờ),
        hoặc bấm “Chạy đơn đến hạn”.
      </p>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {subs.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">Chưa có lịch định kỳ nào.</p>
        ) : (
          <div className="divide-y">
            {subs.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">
                    {s.customer.name} <span className="text-gray-400">·</span> {s.product.name} ×{s.qty}
                  </p>
                  <p className="text-xs text-gray-400">
                    {SUBSCRIPTION_FREQUENCY_LABELS[s.frequency as SubscriptionFrequency]}
                    {s.nextRunAt ? ` · kỳ tới ${formatDate(s.nextRunAt)}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s.isActive ? "Đang chạy" : "Tạm dừng"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
