import { prisma } from "@/lib/db";
import { formatVND } from "@/lib/format";
import { CustomerCreate } from "@/components/CustomerCreate";

export const metadata = { title: "Khách hàng · Quản trị" };

export default async function AdminCustomersPage() {
  const [customers, zones] = await Promise.all([
    prisma.user.findMany({
      where: { roles: { contains: "CUSTOMER" } },
      orderBy: { name: "asc" },
      include: { _count: { select: { orders: true } } },
    }),
    prisma.zone.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Khách hàng</h1>
      </div>
      <CustomerCreate zones={zones} />
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
