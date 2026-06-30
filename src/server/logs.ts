"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import type { ActionResult } from "@/server/orders";

export async function resolveLog(id: string): Promise<ActionResult> {
  await requireUser(["SUPER_ADMIN"]);
  const log = await prisma.errorLog.findUnique({ where: { id } });
  if (!log) return { ok: false, error: "Không tìm thấy" };
  await prisma.errorLog.update({
    where: { id },
    data: { resolved: !log.resolved },
  });
  revalidatePath("/admin/logs");
  return { ok: true };
}

export async function clearResolvedLogs(): Promise<ActionResult> {
  await requireUser(["SUPER_ADMIN"]);
  await prisma.errorLog.deleteMany({ where: { resolved: true } });
  revalidatePath("/admin/logs");
  return { ok: true };
}

export async function clearAllLogs(): Promise<ActionResult> {
  await requireUser(["SUPER_ADMIN"]);
  await prisma.errorLog.deleteMany({});
  revalidatePath("/admin/logs");
  return { ok: true };
}
