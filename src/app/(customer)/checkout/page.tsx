import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { CheckoutForm } from "@/components/customer/CheckoutForm";

export const metadata = { title: "Đặt hàng · Gọi Nước" };

export default async function CheckoutPage() {
  const sessionUser = await requireUser(["CUSTOMER"]);
  const [user, addresses] = await Promise.all([
    prisma.user.findUnique({ where: { id: sessionUser.id }, select: { creditLimit: true } }),
    prisma.address.findMany({
      where: { userId: sessionUser.id },
      include: { zone: true },
      orderBy: { isDefault: "desc" },
    }),
  ]);

  return (
    <CheckoutForm
      canDebt={(user?.creditLimit ?? 0) > 0}
      addresses={addresses.map((a) => ({
        id: a.id,
        label: a.label,
        line: a.line,
        district: a.district,
        isDefault: a.isDefault,
        zone: a.zone ? { shippingFee: a.zone.shippingFee, freeShipThreshold: a.zone.freeShipThreshold } : null,
      }))}
    />
  );
}
