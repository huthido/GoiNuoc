"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingCart, ClipboardList, User } from "lucide-react";
import { useCart, cartCount } from "@/lib/cart-store";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/", label: "Trang chủ", icon: Home, exact: true },
  { href: "/products", label: "Sản phẩm", icon: Package },
  { href: "/cart", label: "Giỏ", icon: ShoppingCart, cart: true },
  { href: "/orders", label: "Đơn", icon: ClipboardList },
  { href: "/account", label: "Tài khoản", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const count = useCart((s) => cartCount(s.items));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-gray-200 bg-white/95 backdrop-blur">
      <ul className="flex">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-2 text-[11px]",
                  active ? "text-brand" : "text-gray-400",
                )}
              >
                <Icon className="h-5 w-5" />
                {t.cart && count > 0 && (
                  <span className="absolute right-1/2 top-1 translate-x-3 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
