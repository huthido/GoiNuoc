"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { assertTransition } from "@/lib/domain/orderStatus";
import { sendPushToUser } from "@/lib/push";
import type { OrderStatus } from "@/lib/domain/types";
import type { ActionResult } from "@/server/orders";

async function loadOrder(orderId: string) {
  return prisma.order.findUnique({ where: { id: orderId } });
}

function revalidateOrder(code?: string) {
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  if (code) revalidatePath(`/admin/orders/${code}`);
}

export async function confirmOrder(orderId: string): Promise<ActionResult> {
  const user = await requireUser(["ADMIN", "STAFF"]);
  const order = await loadOrder(orderId);
  if (!order) return { ok: false, error: "Không tìm thấy đơn" };
  try {
    assertTransition(order.status as OrderStatus, "CONFIRMED", user.role);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  await prisma.order.update({ where: { id: order.id }, data: { status: "CONFIRMED", confirmedAt: new Date() } });
  await prisma.notification.create({
    data: { userId: order.customerId, type: "ORDER", title: "Đơn đã xác nhận", body: `Đơn ${order.code} đã được xác nhận.` },
  });
  await sendPushToUser(order.customerId, {
    title: "Đơn đã xác nhận",
    body: `Đơn ${order.code} đã được xác nhận và đang chuẩn bị giao.`,
    url: `/orders/${order.code}`,
  });
  revalidateOrder(order.code);
  return { ok: true };
}

export async function assignDriver(orderId: string, driverId: string): Promise<ActionResult> {
  const user = await requireUser(["ADMIN", "STAFF"]);
  const order = await loadOrder(orderId);
  if (!order) return { ok: false, error: "Không tìm thấy đơn" };
  const driver = await prisma.user.findFirst({ where: { id: driverId, role: "DRIVER", isActive: true } });
  if (!driver) return { ok: false, error: "Tài xế không hợp lệ" };
  try {
    assertTransition(order.status as OrderStatus, "ASSIGNED", user.role);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  await prisma.order.update({ where: { id: order.id }, data: { status: "ASSIGNED", assignedDriverId: driver.id } });
  await prisma.notification.create({
    data: { userId: driver.id, type: "DELIVERY", title: "Đơn được phân giao", body: `Bạn được phân giao đơn ${order.code}.` },
  });
  await sendPushToUser(driver.id, {
    title: "Đơn mới cần giao",
    body: `Bạn được phân giao đơn ${order.code}.`,
    url: "/driver",
  });
  revalidateOrder(order.code);
  revalidatePath("/driver");
  return { ok: true };
}

export async function cancelOrderAdmin(orderId: string): Promise<ActionResult> {
  const user = await requireUser(["ADMIN", "STAFF"]);
  const order = await loadOrder(orderId);
  if (!order) return { ok: false, error: "Không tìm thấy đơn" };
  try {
    assertTransition(order.status as OrderStatus, "CANCELLED", user.role);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
  await prisma.notification.create({
    data: { userId: order.customerId, type: "ORDER", title: "Đơn đã hủy", body: `Đơn ${order.code} đã bị hủy.` },
  });
  revalidateOrder(order.code);
  return { ok: true };
}

export async function toggleProductActive(productId: string): Promise<ActionResult> {
  await requireUser(["ADMIN", "STAFF"]);
  const p = await prisma.product.findUnique({ where: { id: productId } });
  if (!p) return { ok: false, error: "Không tìm thấy sản phẩm" };
  await prisma.product.update({ where: { id: p.id }, data: { isActive: !p.isActive } });
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function saveProduct(input: {
  id?: string;
  sku: string;
  name: string;
  type: string;
  unit: string;
  price: number;
  depositPrice: number;
  isReturnable: boolean;
  stock: number;
}): Promise<ActionResult> {
  await requireUser(["ADMIN", "STAFF"]);
  const data = {
    sku: input.sku.trim(),
    name: input.name.trim(),
    type: input.type,
    unit: input.unit.trim() || "cái",
    price: Math.max(0, Math.round(input.price)),
    depositPrice: Math.max(0, Math.round(input.depositPrice)),
    isReturnable: input.isReturnable,
    stock: Math.max(0, Math.round(input.stock)),
  };
  if (!data.sku || !data.name) return { ok: false, error: "Thiếu mã hoặc tên sản phẩm" };
  try {
    if (input.id) {
      await prisma.product.update({ where: { id: input.id }, data });
    } else {
      await prisma.product.create({ data });
    }
  } catch {
    return { ok: false, error: "Mã sản phẩm (SKU) đã tồn tại" };
  }
  revalidatePath("/admin/products");
  return { ok: true };
}
