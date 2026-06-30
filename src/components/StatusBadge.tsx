import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/labels";
import type { OrderStatus } from "@/lib/domain/types";
import { cn } from "@/lib/cn";

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        ORDER_STATUS_COLORS[status],
        className,
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
