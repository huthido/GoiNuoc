import { Droplets, Wallet, MapPin, Phone, User as UserIcon } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatVND, formatDateTime } from "@/lib/format";

export const metadata = { title: "Tài khoản · Gọi Nước" };

export default async function AccountPage() {
  const sessionUser = await requireUser(["CUSTOMER"]);
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      addresses: { include: { zone: true }, orderBy: { isDefault: "desc" } },
      bottleTxns: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });
  if (!user) return null;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-brand">
          <UserIcon className="h-6 w-6" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user.name}</p>
          <p className="flex items-center gap-1 text-sm text-gray-500">
            <Phone className="h-3.5 w-3.5" /> {user.phone}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-1.5 text-sky-600">
            <Droplets className="h-4 w-4" />
            <span className="text-xs font-medium">Vỏ đang giữ</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{user.emptyBottlesHeld}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-1.5 text-amber-600">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-medium">Công nợ</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatVND(user.debtBalance)}</p>
          {user.creditLimit > 0 && (
            <p className="text-[11px] text-gray-400">Hạn mức {formatVND(user.creditLimit)}</p>
          )}
        </div>
      </div>

      {/* Sổ vỏ */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-gray-700">Sổ vỏ gần đây</p>
        {user.bottleTxns.length === 0 ? (
          <p className="text-sm text-gray-400">Chưa có giao dịch vỏ.</p>
        ) : (
          <ul className="divide-y text-sm">
            {user.bottleTxns.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2">
                <span className="text-gray-500">{formatDateTime(t.createdAt)}</span>
                <span className="text-gray-700">
                  {t.deliveredFull > 0 && <span className="text-sky-600">+{t.deliveredFull} nhận</span>}
                  {t.returnedEmpty > 0 && <span className="ml-2 text-emerald-600">-{t.returnedEmpty} trả</span>}
                </span>
                <span className="font-semibold text-gray-900">Giữ {t.balanceAfter}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Địa chỉ */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-gray-700">Địa chỉ giao</p>
        <ul className="space-y-2 text-sm">
          {user.addresses.map((a) => (
            <li key={a.id} className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span className="text-gray-700">
                <span className="font-medium">{a.label}</span> — {a.line}
                {a.district ? `, ${a.district}` : ""}
                {a.zone && <span className="text-gray-400"> · {a.zone.name}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
