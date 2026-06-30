import { prisma } from "@/lib/db";
import { formatVND } from "@/lib/format";

export const metadata = { title: "Báo cáo · Quản trị" };

export default async function AdminReportsPage() {
  const [delivered, topProducts, paidAgg, debtAgg] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true }, _count: { _all: true }, where: { status: "DELIVERED" } }),
    prisma.orderItem.groupBy({
      by: ["nameSnapshot"],
      _sum: { qty: true, lineTotal: true },
      orderBy: { _sum: { qty: "desc" } },
      take: 8,
    }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED", paymentStatus: "PAID" } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED", paymentStatus: "DEBT" } }),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Báo cáo</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Đơn đã giao" value={String(delivered._count._all)} />
        <Stat label="Doanh thu" value={formatVND(delivered._sum.total ?? 0)} />
        <Stat label="Đã thu" value={formatVND(paidAgg._sum.total ?? 0)} />
        <Stat label="Còn nợ" value={formatVND(debtAgg._sum.total ?? 0)} />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-900">Sản phẩm bán chạy</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400">
              <th className="pb-2">Sản phẩm</th>
              <th className="pb-2 text-right">Số lượng</th>
              <th className="pb-2 text-right">Doanh thu</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {topProducts.map((p) => (
              <tr key={p.nameSnapshot}>
                <td className="py-2 text-gray-700">{p.nameSnapshot}</td>
                <td className="py-2 text-right font-medium text-gray-900">{p._sum.qty ?? 0}</td>
                <td className="py-2 text-right text-gray-600">{formatVND(p._sum.lineTotal ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}
