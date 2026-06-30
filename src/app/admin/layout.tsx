import Link from "next/link";
import { Truck } from "lucide-react";
import { requireUser } from "@/lib/session";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoutButton } from "@/components/LogoutButton";
import { ROLE_LABELS } from "@/lib/labels";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["ADMIN", "STAFF"]);
  const alsoDriver = user.roles.includes("DRIVER");

  return (
    <div className="min-h-dvh bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💧</span>
          <span className="font-bold text-gray-900">Gọi Nước · Quản trị</span>
        </div>
        <div className="flex items-center gap-3">
          {alsoDriver && (
            <Link
              href="/driver"
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
            >
              <Truck className="h-3.5 w-3.5" /> Giao hàng
            </Link>
          )}
          <span className="hidden text-sm text-gray-500 sm:inline">
            {user.name} · {user.roles.map((r) => ROLE_LABELS[r]).join(" · ")}
          </span>
          <LogoutButton />
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 md:flex-row">
        <AdminNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
