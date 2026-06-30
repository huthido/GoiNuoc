import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import { priceOrder, type PricingLine } from "../src/lib/domain/pricing";
import { bottleMovementFromItems } from "../src/lib/domain/bottles";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "../src/lib/domain/types";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" }),
});

const DAY = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY);

async function wipe() {
  await prisma.bottleTxn.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.zone.deleteMany();
}

async function main() {
  await wipe();
  const passwordHash = bcrypt.hashSync("123456", 10);

  // --- Khu vực giao ---
  const z1 = await prisma.zone.create({
    data: { name: "Quận 1 · 3 · 5", shippingFee: 10000, freeShipThreshold: 150000 },
  });
  const z2 = await prisma.zone.create({
    data: { name: "Thủ Đức", shippingFee: 20000, freeShipThreshold: 250000 },
  });
  const z3 = await prisma.zone.create({
    data: { name: "Bình Thạnh · Gò Vấp", shippingFee: 15000, freeShipThreshold: 200000 },
  });

  // --- Sản phẩm ---
  const productData = [
    { sku: "BINH-NM-20", name: "Bình 20L Tinh khiết (nhà máy)", type: "BINH_20L", unit: "bình", price: 25000, depositPrice: 40000, isReturnable: true, stock: 500, description: "Nước tinh khiết thương hiệu nhà máy, bình úp 20L." },
    { sku: "BINH-LAVIE-20", name: "Bình 20L Lavie", type: "BINH_20L", unit: "bình", price: 55000, depositPrice: 50000, isReturnable: true, stock: 200 },
    { sku: "BINH-AQUA-20", name: "Bình 20L Aquafina", type: "BINH_20L", unit: "bình", price: 60000, depositPrice: 50000, isReturnable: true, stock: 150 },
    { sku: "THUNG-500-24", name: "Thùng 500ml × 24 chai", type: "THUNG_CHAI", unit: "thùng", price: 90000, depositPrice: 0, isReturnable: false, stock: 300 },
    { sku: "THUNG-350-24", name: "Thùng 350ml × 24 chai", type: "THUNG_CHAI", unit: "thùng", price: 80000, depositPrice: 0, isReturnable: false, stock: 250 },
    { sku: "THUNG-1500-12", name: "Thùng 1.5L × 12 chai", type: "THUNG_CHAI", unit: "thùng", price: 110000, depositPrice: 0, isReturnable: false, stock: 180 },
    { sku: "THUNG-5L-4", name: "Thùng 5L × 4 bình", type: "THUNG_CHAI", unit: "thùng", price: 95000, depositPrice: 0, isReturnable: false, stock: 120 },
    { sku: "CHAI-500", name: "Chai 500ml lẻ", type: "CHAI_LE", unit: "chai", price: 5000, depositPrice: 0, isReturnable: false, stock: 1000 },
  ];
  await prisma.product.createMany({ data: productData });
  const products = await prisma.product.findMany();
  const bySku = new Map(products.map((p) => [p.sku, p]));

  // --- Nhân sự ---
  const admin = await prisma.user.create({
    data: { phone: "0900000001", name: "Quản trị viên", passwordHash, role: "ADMIN" },
  });
  const staff = await prisma.user.create({
    data: { phone: "0900000002", name: "Nhân viên CSKH", passwordHash, role: "STAFF" },
  });
  const driverHung = await prisma.user.create({
    data: { phone: "0900000011", name: "Tài xế Hùng", passwordHash, role: "DRIVER" },
  });
  const driverKhoa = await prisma.user.create({
    data: { phone: "0900000012", name: "Tài xế Khoa", passwordHash, role: "DRIVER" },
  });

  // --- Khách hàng + địa chỉ ---
  async function makeCustomer(opts: {
    phone: string;
    name: string;
    line: string;
    district: string;
    zoneId: string;
    creditLimit?: number;
  }) {
    const user = await prisma.user.create({
      data: {
        phone: opts.phone,
        name: opts.name,
        passwordHash,
        role: "CUSTOMER",
        creditLimit: opts.creditLimit ?? 0,
      },
    });
    const address = await prisma.address.create({
      data: {
        userId: user.id,
        label: "Mặc định",
        line: opts.line,
        district: opts.district,
        city: "TP. Hồ Chí Minh",
        zoneId: opts.zoneId,
        isDefault: true,
      },
    });
    return { user, address };
  }

  const an = await makeCustomer({ phone: "0911111111", name: "Nguyễn Văn An", line: "12 Lê Lợi, P. Bến Nghé", district: "Quận 1", zoneId: z1.id });
  const abc = await makeCustomer({ phone: "0922222222", name: "Văn phòng ABC", line: "Tầng 4, Tòa nhà ABC, Võ Văn Ngân", district: "Thủ Đức", zoneId: z2.id, creditLimit: 5000000 });
  const binh = await makeCustomer({ phone: "0933333333", name: "Trần Thị Bình", line: "45 Phan Đăng Lưu", district: "Bình Thạnh", zoneId: z3.id });
  const cafe = await makeCustomer({ phone: "0944444444", name: "Quán Cà phê Sớm Mai", line: "78 Nguyễn Trãi", district: "Quận 5", zoneId: z1.id, creditLimit: 2000000 });
  const cuong = await makeCustomer({ phone: "0955555555", name: "Lê Văn Cường", line: "20 Kha Vạn Cân", district: "Thủ Đức", zoneId: z2.id });

  const customers = [an, abc, binh, cafe, cuong];
  const zoneById = new Map([z1, z2, z3].map((z) => [z.id, z]));

  // Theo dõi vỏ + công nợ chạy dần (cập nhật DB ở cuối).
  const held = new Map<string, number>(customers.map((c) => [c.user.id, 0]));
  const debt = new Map<string, number>(customers.map((c) => [c.user.id, 0]));

  // --- Tạo đơn ---
  let seq = 0;
  const code = () => `GN${String(++seq).padStart(4, "0")}`;

  type ItemSpec = { sku: string; qty: number; returnedEmpties?: number };
  interface OrderSpec {
    cust: { user: { id: string }; address: { id: string; zoneId: string | null } };
    items: ItemSpec[];
    status: OrderStatus;
    paymentMethod?: PaymentMethod;
    driverId?: string;
    daysAgo: number;
  }

  const specs: OrderSpec[] = [
    // Đã giao (cũ → mới) — phát sinh sổ vỏ + công nợ
    { cust: an, items: [{ sku: "BINH-NM-20", qty: 2 }], status: "DELIVERED", paymentMethod: "COD", driverId: driverHung.id, daysAgo: 20 },
    { cust: abc, items: [{ sku: "BINH-AQUA-20", qty: 5 }, { sku: "THUNG-500-24", qty: 2 }], status: "DELIVERED", paymentMethod: "DEBT", driverId: driverKhoa.id, daysAgo: 14 },
    { cust: an, items: [{ sku: "BINH-NM-20", qty: 2, returnedEmpties: 1 }], status: "DELIVERED", paymentMethod: "COD", driverId: driverHung.id, daysAgo: 7 },
    { cust: cafe, items: [{ sku: "BINH-LAVIE-20", qty: 3 }, { sku: "THUNG-1500-12", qty: 1 }], status: "DELIVERED", paymentMethod: "DEBT", driverId: driverHung.id, daysAgo: 5 },
    // Đang trong luồng xử lý
    { cust: binh, items: [{ sku: "THUNG-350-24", qty: 1 }, { sku: "CHAI-500", qty: 4 }], status: "DELIVERING", paymentMethod: "COD", driverId: driverHung.id, daysAgo: 0 },
    { cust: cuong, items: [{ sku: "BINH-NM-20", qty: 1 }], status: "ASSIGNED", paymentMethod: "COD", driverId: driverKhoa.id, daysAgo: 0 },
    { cust: abc, items: [{ sku: "BINH-AQUA-20", qty: 4, returnedEmpties: 4 }], status: "ASSIGNED", paymentMethod: "DEBT", driverId: driverKhoa.id, daysAgo: 0 },
    { cust: cafe, items: [{ sku: "BINH-LAVIE-20", qty: 2, returnedEmpties: 2 }], status: "CONFIRMED", paymentMethod: "DEBT", daysAgo: 0 },
    { cust: binh, items: [{ sku: "THUNG-500-24", qty: 1 }], status: "CONFIRMED", paymentMethod: "COD", daysAgo: 0 },
    // Đơn mới chờ xác nhận
    { cust: an, items: [{ sku: "BINH-NM-20", qty: 2, returnedEmpties: 2 }], status: "PENDING", paymentMethod: "COD", daysAgo: 0 },
    { cust: cuong, items: [{ sku: "THUNG-5L-4", qty: 2 }], status: "PENDING", paymentMethod: "BANK", daysAgo: 0 },
    { cust: cafe, items: [{ sku: "BINH-LAVIE-20", qty: 4, returnedEmpties: 3 }], status: "PENDING", paymentMethod: "DEBT", daysAgo: 0 },
    // Ngoại lệ
    { cust: binh, items: [{ sku: "THUNG-1500-12", qty: 1 }], status: "CANCELLED", paymentMethod: "COD", daysAgo: 3 },
    { cust: cuong, items: [{ sku: "BINH-NM-20", qty: 1 }], status: "FAILED", paymentMethod: "COD", driverId: driverKhoa.id, daysAgo: 2 },
  ];

  // Xử lý theo thứ tự thời gian (cũ trước) để sổ vỏ/công nợ cộng dồn đúng.
  specs.sort((a, b) => b.daysAgo - a.daysAgo);

  for (const spec of specs) {
    const lines: PricingLine[] = [];
    const itemRows = spec.items.map((it) => {
      const p = bySku.get(it.sku)!;
      lines.push({
        unitPrice: p.price,
        qty: it.qty,
        depositPrice: p.depositPrice,
        returnedEmpties: it.returnedEmpties,
        isReturnable: p.isReturnable,
      });
      return {
        productId: p.id,
        nameSnapshot: p.name,
        unitPrice: p.price,
        depositPrice: p.depositPrice,
        qty: it.qty,
        returnedEmpties: it.returnedEmpties ?? 0,
        lineTotal: p.price * it.qty,
      };
    });

    const zone = spec.cust.address.zoneId ? zoneById.get(spec.cust.address.zoneId) : undefined;
    const priced = priceOrder({
      lines,
      shippingFee: zone?.shippingFee ?? 0,
      freeShipThreshold: zone?.freeShipThreshold ?? 0,
    });

    const delivered = spec.status === "DELIVERED";
    const isDebt = spec.paymentMethod === "DEBT";
    const paymentStatus: PaymentStatus = delivered ? (isDebt ? "DEBT" : "PAID") : "UNPAID";

    const order = await prisma.order.create({
      data: {
        code: code(),
        customerId: spec.cust.user.id,
        addressId: spec.cust.address.id,
        status: spec.status,
        paymentMethod: spec.paymentMethod ?? "COD",
        paymentStatus,
        subtotal: priced.subtotal,
        shippingFee: priced.shippingFee,
        depositTotal: priced.depositTotal,
        discount: priced.discount,
        total: priced.total,
        assignedDriverId: spec.driverId ?? null,
        confirmedAt: ["CONFIRMED", "ASSIGNED", "DELIVERING", "DELIVERED", "FAILED"].includes(spec.status) ? ago(spec.daysAgo) : null,
        deliveredAt: delivered ? ago(spec.daysAgo) : null,
        createdAt: ago(spec.daysAgo),
        items: { create: itemRows },
      },
    });

    if (delivered) {
      const move = bottleMovementFromItems(
        spec.items.map((it) => ({
          qty: it.qty,
          returnedEmpties: it.returnedEmpties,
          isReturnable: bySku.get(it.sku)!.isReturnable,
        })),
      );
      if (move.deliveredFull !== 0 || move.returnedEmpty !== 0) {
        const cur = held.get(spec.cust.user.id) ?? 0;
        const after = cur + move.deliveredFull - move.returnedEmpty;
        held.set(spec.cust.user.id, after);
        await prisma.bottleTxn.create({
          data: {
            customerId: spec.cust.user.id,
            orderId: order.id,
            deliveredFull: move.deliveredFull,
            returnedEmpty: move.returnedEmpty,
            balanceAfter: after,
            note: `Giao đơn ${order.code}`,
            createdAt: ago(spec.daysAgo),
          },
        });
      }
      if (isDebt) debt.set(spec.cust.user.id, (debt.get(spec.cust.user.id) ?? 0) + priced.total);
    }
  }

  // Cập nhật số vỏ + công nợ cuối cùng cho khách.
  for (const c of customers) {
    await prisma.user.update({
      where: { id: c.user.id },
      data: {
        emptyBottlesHeld: held.get(c.user.id) ?? 0,
        debtBalance: debt.get(c.user.id) ?? 0,
      },
    });
  }

  // Vài lịch đặt định kỳ mẫu (nextRunAt ở tương lai gần để không tự bắn khi seed).
  await prisma.subscription.create({
    data: { customerId: abc.user.id, productId: bySku.get("BINH-AQUA-20")!.id, qty: 5, frequency: "WEEKLY", addressId: abc.address.id, nextRunAt: ago(-2), isActive: true },
  });
  await prisma.subscription.create({
    data: { customerId: an.user.id, productId: bySku.get("BINH-NM-20")!.id, qty: 2, frequency: "BIWEEKLY", addressId: an.address.id, nextRunAt: ago(-6), isActive: true },
  });
  await prisma.subscription.create({
    data: { customerId: cafe.user.id, productId: bySku.get("BINH-LAVIE-20")!.id, qty: 3, frequency: "WEEKLY", addressId: cafe.address.id, nextRunAt: ago(-9), isActive: false },
  });

  // Vài thông báo mẫu cho khách An.
  await prisma.notification.create({
    data: { userId: an.user.id, type: "ORDER", title: "Đơn đã giao", body: "Đơn GN0003 đã giao thành công. Cảm ơn bạn!" },
  });

  const counts = {
    zones: await prisma.zone.count(),
    products: await prisma.product.count(),
    users: await prisma.user.count(),
    orders: await prisma.order.count(),
    bottleTxns: await prisma.bottleTxn.count(),
    subscriptions: await prisma.subscription.count(),
  };

  console.log("✅ Seed xong:", counts);
  console.log("\n— Tài khoản demo (mật khẩu: 123456) —");
  console.log("  Admin   : 0900000001");
  console.log("  Nhân viên: 0900000002");
  console.log("  Tài xế  : 0900000011 (Hùng), 0900000012 (Khoa)");
  console.log("  Khách   : 0911111111 (An), 0922222222 (VP ABC, có công nợ), 0944444444 (Cà phê)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
