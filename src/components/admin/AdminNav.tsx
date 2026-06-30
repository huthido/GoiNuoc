"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Package, Users, Truck, MapPinned, BarChart3, CalendarClock } from "lucide-react";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Đơn hàng", icon: ClipboardList },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/customers", label: "Khách hàng", icon: Users },
  { href: "/admin/drivers", label: "Tài xế", icon: Truck },
  { href: "/admin/subscriptions", label: "Định kỳ", icon: CalendarClock },
  { href: "/admin/zones", label: "Khu vực", icon: MapPinned },
  { href: "/admin/reports", label: "Báo cáo", icon: BarChart3 },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="md:w-52 md:shrink-0">
      <ul className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm md:flex-col">
        {LINKS.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          const Icon = l.icon;
          return (
            <li key={l.href} className="shrink-0">
              <Link
                href={l.href}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium",
                  active ? "bg-brand text-white" : "text-gray-600 hover:bg-slate-100",
                )}
              >
                <Icon className="h-4 w-4" />
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
