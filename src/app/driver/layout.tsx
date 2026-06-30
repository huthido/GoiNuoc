import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { requireUser } from "@/lib/session";
import { LogoutButton } from "@/components/LogoutButton";
import { PushManager } from "@/components/PushManager";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["DRIVER"]);
  const alsoAdmin = user.roles.includes("ADMIN") || user.roles.includes("STAFF");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-emerald-600 px-4 py-3 text-white">
        <Link href="/driver" className="flex items-center gap-2">
          <span className="text-xl">🛵</span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Giao nước</p>
            <p className="text-[11px] text-emerald-100">{user.name}</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {alsoAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 rounded-full bg-emerald-700/60 px-2.5 py-1 text-xs font-medium text-white"
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> Quản trị
            </Link>
          )}
          <LogoutButton className="text-emerald-100 hover:text-white" />
        </div>
      </header>
      <PushManager />
      <main className="flex-1">{children}</main>
    </div>
  );
}
