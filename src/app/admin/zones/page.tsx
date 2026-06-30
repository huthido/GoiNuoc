import { prisma } from "@/lib/db";
import { formatVND } from "@/lib/format";

export const metadata = { title: "Khu vực giao · Quản trị" };

export default async function AdminZonesPage() {
  const zones = await prisma.zone.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { addresses: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Khu vực giao</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {zones.map((z) => (
          <div key={z.id} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="font-semibold text-gray-900">{z.name}</p>
            <p className="mt-1 text-sm text-gray-500">
              Phí giao: <b className="text-gray-900">{z.shippingFee === 0 ? "Miễn phí" : formatVND(z.shippingFee)}</b>
            </p>
            <p className="text-sm text-gray-500">
              Miễn phí từ: {z.freeShipThreshold > 0 ? formatVND(z.freeShipThreshold) : "—"}
            </p>
            <p className="mt-1 text-xs text-gray-400">{z._count.addresses} địa chỉ</p>
          </div>
        ))}
      </div>
    </div>
  );
}
