// Tạo đơn dùng chung (KHÔNG auth) — dùng bởi server action khách đặt tay và engine định kỳ.
import { prisma } from "@/lib/db";
import { priceOrder, type PricingLine } from "@/lib/domain/pricing";
import type { PaymentMethod } from "@/lib/domain/types";

export async function nextOrderCode(): Promise<string> {
  const n = await prisma.order.count();
  return "GN" + String(n + 1).padStart(4, "0");
}

export interface CreateOrderInput {
  customerId: string;
  addressId: string;
  items: { productId: string; qty: number }[];
  paymentMethod: PaymentMethod;
  note?: string | null;
  notifyAdmins?: boolean;
}

export type CreateOrderOutcome =
  | { ok: true; code: string; orderId: string }
  | { ok: false; error: string };

export async function createOrderForCustomer(input: CreateOrderInput): Promise<CreateOrderOutcome> {
  if (input.items.length === 0) return { ok: false, error: "Đơn không có sản phẩm" };

  const address = await prisma.address.findFirst({
    where: { id: input.addressId, userId: input.customerId },
    include: { zone: true },
  });
  if (!address) return { ok: false, error: "Địa chỉ giao không hợp lệ" };

  const products = await prisma.product.findMany({
    where: { id: { in: input.items.map((i) => i.productId) }, isActive: true },
  });
  const pMap = new Map(products.map((p) => [p.id, p]));

  const lines: PricingLine[] = [];
  const itemRows: {
    productId: string;
    nameSnapshot: string;
    unitPrice: number;
    depositPrice: number;
    qty: number;
    returnedEmpties: number;
    lineTotal: number;
  }[] = [];

  for (const it of input.items) {
    const p = pMap.get(it.productId);
    if (!p) return { ok: false, error: "Có sản phẩm không còn khả dụng" };
    lines.push({ unitPrice: p.price, qty: it.qty, depositPrice: p.depositPrice, isReturnable: p.isReturnable });
    itemRows.push({
      productId: p.id,
      nameSnapshot: p.name,
      unitPrice: p.price,
      depositPrice: p.depositPrice,
      qty: it.qty,
      returnedEmpties: 0,
      lineTotal: p.price * it.qty,
    });
  }

  const priced = priceOrder({
    lines,
    shippingFee: address.zone?.shippingFee ?? 0,
    freeShipThreshold: address.zone?.freeShipThreshold ?? 0,
  });

  const order = await prisma.order.create({
    data: {
      code: await nextOrderCode(),
      customerId: input.customerId,
      addressId: address.id,
      status: "PENDING",
      paymentMethod: input.paymentMethod,
      paymentStatus: "UNPAID",
      subtotal: priced.subtotal,
      shippingFee: priced.shippingFee,
      depositTotal: priced.depositTotal,
      discount: priced.discount,
      total: priced.total,
      note: input.note ?? null,
      items: { create: itemRows },
    },
  });

  if (input.notifyAdmins !== false) {
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "STAFF"] } },
      select: { id: true },
    });
    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: "ORDER",
          title: "Đơn mới",
          body: `Đơn ${order.code} vừa được đặt.`,
        })),
      });
    }
  }

  return { ok: true, code: order.code, orderId: order.id };
}
