import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { SubscriptionManager } from "@/components/customer/SubscriptionManager";

export const metadata = { title: "Đặt định kỳ · Gọi Nước" };

export default async function SubscriptionsPage() {
  const user = await requireUser(["CUSTOMER"]);
  const [subs, products, addresses] = await Promise.all([
    prisma.subscription.findMany({
      where: { customerId: user.id },
      include: { product: true },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: [{ type: "asc" }, { price: "asc" }] }),
    prisma.address.findMany({ where: { userId: user.id }, orderBy: { isDefault: "desc" } }),
  ]);

  return (
    <SubscriptionManager
      subscriptions={subs.map((s) => ({
        id: s.id,
        productName: s.product.name,
        qty: s.qty,
        frequency: s.frequency,
        nextRunAt: s.nextRunAt ? s.nextRunAt.toISOString() : null,
        isActive: s.isActive,
      }))}
      products={products.map((p) => ({ id: p.id, name: p.name, unit: p.unit }))}
      addresses={addresses.map((a) => ({ id: a.id, label: a.label, line: a.line, isDefault: a.isDefault }))}
    />
  );
}
