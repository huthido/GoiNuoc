"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { rolesToCsv } from "@/lib/domain/types";
import type { ActionResult } from "@/server/orders";

export interface CreateCustomerInput {
  name: string;
  phone: string;
  password?: string;
  line?: string;
  district?: string;
  zoneId?: string;
}

/** Tạo nhanh tài khoản khách — cho admin/nhân viên/tài xế (tài xế onboard khách tại hiện trường). */
export async function createCustomer(input: CreateCustomerInput): Promise<ActionResult<{ id: string }>> {
  await requireUser(["ADMIN", "STAFF", "DRIVER"]);

  const name = input.name?.trim();
  const phone = input.phone?.trim();
  if (!name || !phone) return { ok: false, error: "Vui lòng nhập tên và số điện thoại" };
  if (!/^0\d{8,10}$/.test(phone)) return { ok: false, error: "Số điện thoại không hợp lệ" };

  if (await prisma.user.findUnique({ where: { phone } })) {
    return { ok: false, error: "Số điện thoại đã tồn tại" };
  }

  const passwordHash = bcrypt.hashSync(input.password?.trim() || "123456", 10);
  const line = input.line?.trim();

  const user = await prisma.user.create({
    data: {
      phone,
      name,
      passwordHash,
      roles: rolesToCsv(["CUSTOMER"]),
      ...(line
        ? {
            addresses: {
              create: {
                label: "Mặc định",
                line,
                district: input.district?.trim() || null,
                city: "TP. Hồ Chí Minh",
                zoneId: input.zoneId || null,
                isDefault: true,
              },
            },
          }
        : {}),
    },
  });

  revalidatePath("/admin/customers");
  return { ok: true, data: { id: user.id } };
}
