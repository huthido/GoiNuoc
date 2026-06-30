import { prisma } from "@/lib/db";
import { formatVND } from "@/lib/format";

export const metadata = { title: "Khách hàng · Quản trị" };

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { name: "asc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Khách hàng</h1>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="divide-y">
          {customers.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3">
              <div className="min-w-[40%] flex-1">
                <p className="font-semibold text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-400">
                  {c.phone} · {c._count.orders} đơn
                </p>
              </div>
              <Metric label="Vỏ giữ" value={String(c.emptyBottlesHeld)} tone="sky" />
              <Metric
                label="Công nợ"
                value={formatVND(c.debtBalance)}
                tone={c.debtBalance > 0 ? "amber" : "gray"}
              />
              {c.creditLimit > 0 && <Metric label="Hạn mức" value={formatVND(c.creditLimit)} tone="gray" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "sky" | "amber" | "gray" }) {
  const color = tone === "sky" ? "text-sky-700" : tone === "amber" ? "text-amber-700" : "text-gray-700";
  return (
    <div className="text-right">
      <p className="text-[11px] text-gray-400">{label}</p>
      <p className={`text-sm font-semibold ${color}`}>{value}</p>
    </div>
  );
}
