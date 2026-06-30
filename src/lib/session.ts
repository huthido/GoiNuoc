import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAnyRole, type Role } from "@/lib/domain/types";

export type SessionUser = { id: string; roles: Role[]; phone: string; name?: string | null };

export async function getCurrentUser(): Promise<SessionUser | null> {
  return (await auth())?.user ?? null;
}

/** Trang "nhà" theo vai trò (ưu tiên quản trị > tài xế > khách). Không vai trò -> bắt đăng nhập lại. */
export function homeFor(roles: Role[]): string {
  if (roles.includes("ADMIN") || roles.includes("STAFF")) return "/admin";
  if (roles.includes("DRIVER")) return "/driver";
  if (roles.includes("CUSTOMER")) return "/";
  return "/login";
}

/** Bắt buộc đăng nhập; nếu truyền allowed thì user phải có ÍT NHẤT một vai trò trong đó. */
export async function requireUser(allowed?: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Token cũ (vd. sau khi đổi schema role->roles) không có vai trò -> buộc đăng nhập lại, tránh vòng lặp.
  if (user.roles.length === 0) redirect("/login");
  if (allowed && !hasAnyRole(user.roles, allowed)) redirect(homeFor(user.roles));
  return user;
}
