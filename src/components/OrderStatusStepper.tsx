import { Check } from "lucide-react";
import type { OrderStatus } from "@/lib/domain/types";
import { ORDER_STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/cn";

const HAPPY_PATH: OrderStatus[] = ["PENDING", "CONFIRMED", "ASSIGNED", "DELIVERING", "DELIVERED"];

export function OrderStatusStepper({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED" || status === "FAILED") {
    return (
      <div
        className={cn(
          "rounded-xl px-4 py-3 text-sm font-medium",
          status === "CANCELLED" ? "bg-gray-100 text-gray-600" : "bg-rose-50 text-rose-700",
        )}
      >
        {ORDER_STATUS_LABELS[status]}
      </div>
    );
  }

  const current = HAPPY_PATH.indexOf(status);

  return (
    <ol className="flex items-center">
      {HAPPY_PATH.map((s, idx) => {
        const done = idx < current;
        const active = idx === current;
        return (
          <li key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  done && "bg-emerald-500 text-white",
                  active && "bg-brand text-white ring-4 ring-sky-100",
                  !done && !active && "bg-gray-200 text-gray-400",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : idx + 1}
              </span>
              <span className={cn("mt-1 w-14 text-center text-[10px]", active ? "font-semibold text-brand" : "text-gray-400")}>
                {ORDER_STATUS_LABELS[s]}
              </span>
            </div>
            {idx < HAPPY_PATH.length - 1 && (
              <span className={cn("mx-1 h-0.5 flex-1", idx < current ? "bg-emerald-500" : "bg-gray-200")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
