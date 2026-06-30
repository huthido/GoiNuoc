import { prisma } from "@/lib/db";

export const metadata = { title: "Tài xế · Quản trị" };

export default async function AdminDriversPage() {
  const drivers = await prisma.user.findMany({ where: { role: "DRIVER" }, orderBy: { name: "asc" } });
  const active = await prisma.order.groupBy({
    by: ["assignedDriverId"],
    where: { status: { in: ["ASSIGNED", "DELIVERING"] } },
    _count: { _all: true },
  });
  const delivered = await prisma.order.groupBy({
    by: ["assignedDriverId"],
    where: { status: "DELIVERED" },
    _count: { _all: true },
  });
  const activeMap = new Map(active.map((a) => [a.assignedDriverId, a._count._all]));
  const deliveredMap = new Map(delivered.map((d) => [d.assignedDriverId, d._count._all]));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Tài xế</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {drivers.map((d) => (
          <div key={d.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-lg">🛵</div>
              <div>
                <p className="font-semibold text-gray-900">{d.name}</p>
                <p className="text-xs text-gray-400">{d.phone}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-4 text-sm">
              <span className="text-gray-600">
                Đang giao: <b className="text-brand">{activeMap.get(d.id) ?? 0}</b>
              </span>
              <span className="text-gray-600">
                Đã giao: <b className="text-emerald-600">{deliveredMap.get(d.id) ?? 0}</b>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
