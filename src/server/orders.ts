"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { checkoutSchema, type CheckoutInput } from "@/lib/validators/order";
import { createOrderForCustomer } from "@/lib/orders";
import { assertTransition } from "@/lib/domain/orderStatus";
import type { OrderStatus } from "@/lib/domain/types";

export type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

/** Khách tạo đơn mới (PENDING). Giá tính lại từ DB, không tin client. */
export async function createOrder(input: CheckoutInput): Promise<ActionResult<{ code: string }>> {
  const user = await requireUser(["CUSTOMER"]);
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const data = parsed.data;

  const res = await createOrderForCustomer({
    customerId: user.id,
    addressId: data.addressId,
    items: data.items,
    paymentMethod: data.paymentMethod,
    note: data.note ?? null,
  });
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/orders");
  revalidatePath("/admin/orders");
  return { ok: true, data: { code: res.code } };
}

/** Khách tự hủy đơn khi còn PENDING/CONFIRMED. */
export async function cancelMyOrder(orderId: string): Promise<ActionResult> {
  const user = await requireUser(["CUSTOMER"]);
  const order = await prisma.order.findFirst({ where: { id: orderId, customerId: user.id } });
  if (!order) return { ok: false, error: "Không tìm thấy đơn" };
  try {
    assertTransition(order.status as OrderStatus, "CANCELLED", "CUSTOMER");
  } catch {
    return { ok: false, error: "Đơn không thể hủy ở trạng thái hiện tại" };
  }
  await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
  revalidatePath("/orders");
  revalidatePath(`/orders/${order.code}`);
  return { ok: true };
}
