import Link from "next/link";
import { requireUser } from "@/lib/session";
import { BottomNav } from "@/components/customer/BottomNav";
import { LogoutButton } from "@/components/LogoutButton";
import { PushManager } from "@/components/PushManager";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["CUSTOMER"]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-slate-50 pb-16">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-brand px-4 py-3 text-white">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">💧</span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Gọi Nước</p>
            <p className="text-[11px] text-sky-100">Xin chào, {user.name}</p>
          </div>
        </Link>
        <LogoutButton className="text-sky-100 hover:text-white" />
      </header>

      <PushManager />

      <main className="flex-1">{children}</main>

      <BottomNav />
    </div>
  );
}
