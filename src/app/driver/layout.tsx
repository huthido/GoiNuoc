import Link from "next/link";
import { requireUser } from "@/lib/session";
import { LogoutButton } from "@/components/LogoutButton";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["DRIVER"]);

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
        <LogoutButton className="text-emerald-100 hover:text-white" />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
