"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/server/auth-actions";
import { cn } from "@/lib/cn";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={cn(
          "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800",
          className,
        )}
      >
        <LogOut className="h-4 w-4" />
        Đăng xuất
      </button>
    </form>
  );
}
