"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ROLES, parseRoles, rolesToCsv, type Role } from "@/lib/domain/types";
import type { ActionResult } from "@/server/orders";

function sanitize(rolesInput: string[]): Role[] {
  return ROLES.filter((r) => rolesInput.includes(r));
}

/** Tạo tài khoản nội bộ với nhiều vai trò (vd. ADMIN + DRIVER). Chỉ ADMIN. */
export async function createStaff(input: {
  name: string;
  phone: string;
  password?: string;
  roles: string[];
}): Promise<ActionResult> {
  const me = await requireUser(["ADMIN"]);
  const name = input.name?.trim();
  const phone = input.phone?.trim();
  if (!name || !phone)
    return { ok: false, error: "Vui lòng nhập tên và số điện thoại" };
  if (!/^0\d{8,10}$/.test(phone))
    return { ok: false, error: "Số điện thoại không hợp lệ" };
  const roles = sanitize(input.roles);
  if (roles.length === 0) return { ok: false, error: "Chọn ít nhất 1 vai trò" };
  if (roles.includes("SUPER_ADMIN") && !me.roles.includes("SUPER_ADMIN")) {
    return {
      ok: false,
      error: "Chỉ Super Admin được tạo tài khoản Super Admin",
    };
  }
  if (await prisma.user.findUnique({ where: { phone } }))
    return { ok: false, error: "Số điện thoại đã tồn tại" };

  const passwordHash = bcrypt.hashSync(input.password?.trim() || "123456", 10);
  await prisma.user.create({
    data: { name, phone, passwordHash, roles: rolesToCsv(roles) },
  });
  revalidatePath("/admin/staff");
  return { ok: true };
}

/** Đặt lại danh sách vai trò cho một user. Chỉ ADMIN. */
export async function setUserRoles(
  userId: string,
  rolesInput: string[],
): Promise<ActionResult> {
  const me = await requireUser(["ADMIN"]);
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "Không tìm thấy người dùng" };

  const oldRoles = parseRoles(target.roles);
  const roles = sanitize(rolesInput);
  if (roles.length === 0) return { ok: false, error: "Chọn ít nhất 1 vai trò" };

  // Chỉ Super Admin được thêm/gỡ vai trò SUPER_ADMIN.
  if (
    oldRoles.includes("SUPER_ADMIN") !== roles.includes("SUPER_ADMIN") &&
    !me.roles.includes("SUPER_ADMIN")
  ) {
    return {
      ok: false,
      error: "Chỉ Super Admin được thay đổi vai trò Super Admin",
    };
  }
  // Không tự gỡ quyền quản trị của chính mình.
  if (
    userId === me.id &&
    !roles.includes("ADMIN") &&
    !roles.includes("STAFF") &&
    !roles.includes("SUPER_ADMIN")
  ) {
    return { ok: false, error: "Không thể tự gỡ quyền quản trị của chính bạn" };
  }
  // Giữ ít nhất 1 tài khoản quản trị (ADMIN hoặc SUPER_ADMIN).
  const hadAdmin =
    oldRoles.includes("ADMIN") || oldRoles.includes("SUPER_ADMIN");
  const willHaveAdmin =
    roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");
  if (hadAdmin && !willHaveAdmin) {
    const admins = await prisma.user.count({
      where: {
        OR: [
          { roles: { contains: "ADMIN" } },
          { roles: { contains: "SUPER_ADMIN" } },
        ],
        isActive: true,
      },
    });
    if (admins <= 1)
      return { ok: false, error: "Hệ thống phải còn ít nhất 1 quản trị" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { roles: rolesToCsv(roles) },
  });
  revalidatePath("/admin/staff");
  return { ok: true };
}

/** Khóa/mở tài khoản nội bộ. Chỉ ADMIN; không tự khóa mình. */
export async function toggleStaffActive(userId: string): Promise<ActionResult> {
  const me = await requireUser(["ADMIN"]);
  if (userId === me.id)
    return { ok: false, error: "Không thể tự khóa tài khoản của bạn" };
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) return { ok: false, error: "Không tìm thấy người dùng" };
  await prisma.user.update({
    where: { id: u.id },
    data: { isActive: !u.isActive },
  });
  revalidatePath("/admin/staff");
  return { ok: true };
}
