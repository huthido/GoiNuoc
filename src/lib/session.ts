import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@/lib/domain/types";

export type SessionUser = { id: string; role: Role; phone: string; name?: string | null };

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user ?? null;
}

/** Trang "nhà" theo vai trò. */
export function homeFor(role: Role): string {
  if (role === "ADMIN" || role === "STAFF") return "/admin";
  if (role === "DRIVER") return "/driver";
  return "/";
}

/** Bắt buộc đăng nhập; nếu truyền roles thì bắt buộc đúng vai trò (sai sẽ điều hướng về nhà của vai trò đó). */
export async function requireUser(roles?: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}
