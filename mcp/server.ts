// MCP server quản trị Gọi Nước — kết nối thẳng DB (Prisma) + tái dùng domain thuần.
// Chạy: npm run mcp  (stdio). Khai báo trong client MCP (xem .mcp.json / MCP-SERVER.md).
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { canTransition } from "../src/lib/domain/orderStatus";
import { priceOrder, type PricingLine } from "../src/lib/domain/pricing";
import { bottleMovementFromItems } from "../src/lib/domain/bottles";
import { advanceUntilFuture } from "../src/lib/domain/subscription";
import { ROLES, parseRoles, rolesToCsv } from "../src/lib/domain/types";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  }),
});

const ok = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});
const err = (message: string) => ({
  isError: true,
  content: [{ type: "text" as const, text: message }],
});

async function nextOrderCode() {
  return "GN" + String((await prisma.order.count()) + 1).padStart(4, "0");
}

// Tạo đơn (PENDING) — dùng cho create_order/run_due_subscriptions.
async function createOrder(
  customerId: string,
  addressId: string,
  items: { productId: string; qty: number }[],
  paymentMethod = "COD",
  note?: string,
) {
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: customerId },
    include: { zone: true },
  });
  if (!address) throw new Error("Địa chỉ không hợp lệ");
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, isActive: true },
  });
  const pm = new Map(products.map((p) => [p.id, p]));
  const lines: PricingLine[] = [];
  const rows = items.map((it) => {
    const p = pm.get(it.productId);
    if (!p) throw new Error("Sản phẩm không khả dụng");
    lines.push({
      unitPrice: p.price,
      qty: it.qty,
      depositPrice: p.depositPrice,
      isReturnable: p.isReturnable,
    });
    return {
      productId: p.id,
      nameSnapshot: p.name,
      unitPrice: p.price,
      depositPrice: p.depositPrice,
      qty: it.qty,
      returnedEmpties: 0,
      lineTotal: p.price * it.qty,
    };
  });
  const priced = priceOrder({
    lines,
    shippingFee: address.zone?.shippingFee ?? 0,
    freeShipThreshold: address.zone?.freeShipThreshold ?? 0,
  });
  return prisma.order.create({
    data: {
      code: await nextOrderCode(),
      customerId,
      addressId: address.id,
      status: "PENDING",
      paymentMethod,
      paymentStatus: "UNPAID",
      subtotal: priced.subtotal,
      shippingFee: priced.shippingFee,
      depositTotal: priced.depositTotal,
      discount: 0,
      total: priced.total,
      note: note ?? null,
      items: { create: rows },
    },
  });
}

const server = new McpServer({ name: "goinuoc-admin", version: "1.0.0" });

server.registerTool(
  "get_stats",
  {
    description:
      "Thống kê tổng quan: đơn theo trạng thái, doanh thu, công nợ, vỏ lưu hành, lỗi chưa xử lý.",
  },
  async () => {
    const [byStatus, revenue, debt, bottles, customers, unresolved] =
      await Promise.all([
        prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.order.aggregate({
          _sum: { total: true },
          where: { status: "DELIVERED" },
        }),
        prisma.user.aggregate({
          _sum: { debtBalance: true },
          where: { roles: { contains: "CUSTOMER" } },
        }),
        prisma.user.aggregate({
          _sum: { emptyBottlesHeld: true },
          where: { roles: { contains: "CUSTOMER" } },
        }),
        prisma.user.count({ where: { roles: { contains: "CUSTOMER" } } }),
        prisma.errorLog.count({ where: { resolved: false } }),
      ]);
    return ok({
      ordersByStatus: Object.fromEntries(
        byStatus.map((g) => [g.status, g._count._all]),
      ),
      revenueDelivered: revenue._sum.total ?? 0,
      customerDebt: debt._sum.debtBalance ?? 0,
      bottlesInCirculation: bottles._sum.emptyBottlesHeld ?? 0,
      customers,
      unresolvedErrors: unresolved,
    });
  },
);

server.registerTool(
  "list_orders",
  {
    description: "Liệt kê đơn hàng (lọc theo trạng thái).",
    inputSchema: {
      status: z.string().optional(),
      limit: z.number().int().positive().max(200).optional(),
    },
  },
  async ({ status, limit }) => {
    const orders = await prisma.order.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: limit ?? 30,
      include: {
        customer: { select: { name: true, phone: true } },
        driver: { select: { name: true } },
      },
    });
    return ok(
      orders.map((o) => ({
        code: o.code,
        status: o.status,
        total: o.total,
        payment: `${o.paymentMethod}/${o.paymentStatus}`,
        customer: o.customer.name,
        driver: o.driver?.name ?? null,
        createdAt: o.createdAt,
      })),
    );
  },
);

server.registerTool(
  "get_order",
  {
    description: "Chi tiết một đơn theo mã.",
    inputSchema: { code: z.string() },
  },
  async ({ code }) => {
    const o = await prisma.order.findUnique({
      where: { code },
      include: {
        items: true,
        customer: true,
        address: { include: { zone: true } },
        driver: true,
        bottleTxns: true,
      },
    });
    if (!o) return err("Không tìm thấy đơn " + code);
    return ok(o);
  },
);

server.registerTool(
  "set_order_status",
  {
    description:
      "Đổi trạng thái đơn (quyền admin): confirm | assign | start | deliver | cancel | fail. assign cần driverPhone. deliver có thể kèm emptiesCollected + collected.",
    inputSchema: {
      code: z.string(),
      action: z.enum([
        "confirm",
        "assign",
        "start",
        "deliver",
        "cancel",
        "fail",
      ]),
      driverPhone: z.string().optional(),
      emptiesCollected: z.number().int().min(0).optional(),
      collected: z.boolean().optional(),
    },
  },
  async ({ code, action, driverPhone, emptiesCollected, collected }) => {
    const order = await prisma.order.findUnique({
      where: { code },
      include: { items: true, customer: true },
    });
    if (!order) return err("Không tìm thấy đơn " + code);
    const from = order.status as Parameters<typeof canTransition>[0];

    const map = {
      confirm: "CONFIRMED",
      assign: "ASSIGNED",
      start: "DELIVERING",
      deliver: "DELIVERED",
      cancel: "CANCELLED",
      fail: "FAILED",
    } as const;
    const to = map[action];
    if (!canTransition(from, to, ["ADMIN"]))
      return err(`Không thể ${action}: ${from} → ${to} không hợp lệ.`);

    if (action === "assign") {
      if (!driverPhone) return err("assign cần driverPhone");
      const driver = await prisma.user.findFirst({
        where: {
          phone: driverPhone,
          roles: { contains: "DRIVER" },
          isActive: true,
        },
      });
      if (!driver) return err("Không tìm thấy tài xế " + driverPhone);
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "ASSIGNED", assignedDriverId: driver.id },
      });
      return ok({ code, status: "ASSIGNED", driver: driver.name });
    }

    if (action === "deliver") {
      const products = await prisma.product.findMany({
        where: { id: { in: order.items.map((i) => i.productId) } },
        select: { id: true, isReturnable: true },
      });
      const returnable = new Set(
        products.filter((p) => p.isReturnable).map((p) => p.id),
      );
      const move = bottleMovementFromItems(
        order.items.map((it) => ({
          qty: it.qty,
          returnedEmpties: 0,
          isReturnable: returnable.has(it.productId),
        })),
      );
      const empties = emptiesCollected ?? 0;
      let toDistribute = Math.min(empties, move.deliveredFull);
      let depositTotal = 0;
      for (const it of order.items) {
        if (!returnable.has(it.productId)) continue;
        const ret = Math.min(toDistribute, it.qty);
        toDistribute -= ret;
        depositTotal += it.depositPrice * Math.max(0, it.qty - ret);
        await prisma.orderItem.update({
          where: { id: it.id },
          data: { returnedEmpties: ret },
        });
      }
      const total = Math.max(
        0,
        order.subtotal + depositTotal + order.shippingFee - order.discount,
      );
      const balanceAfter =
        order.customer.emptyBottlesHeld + move.deliveredFull - empties;
      const paid = collected ?? order.paymentMethod !== "DEBT";
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: "DELIVERED",
            deliveredAt: new Date(),
            depositTotal,
            total,
            paymentStatus: paid ? "PAID" : "DEBT",
          },
        });
        if (move.deliveredFull !== 0 || empties !== 0) {
          await tx.bottleTxn.create({
            data: {
              customerId: order.customerId,
              orderId: order.id,
              deliveredFull: move.deliveredFull,
              returnedEmpty: empties,
              balanceAfter,
              note: `MCP giao ${order.code}`,
            },
          });
        }
        await tx.user.update({
          where: { id: order.customerId },
          data: {
            emptyBottlesHeld: balanceAfter,
            ...(paid ? {} : { debtBalance: { increment: total } }),
          },
        });
      });
      return ok({
        code,
        status: "DELIVERED",
        total,
        depositTotal,
        bottlesHeld: balanceAfter,
        paymentStatus: paid ? "PAID" : "DEBT",
      });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: to,
        ...(to === "CONFIRMED" ? { confirmedAt: new Date() } : {}),
      },
    });
    return ok({ code, status: to });
  },
);

server.registerTool(
  "list_customers",
  {
    description: "Liệt kê khách hàng (tìm theo tên/SĐT).",
    inputSchema: {
      search: z.string().optional(),
      limit: z.number().int().positive().max(200).optional(),
    },
  },
  async ({ search, limit }) => {
    const where = {
      roles: { contains: "CUSTOMER" },
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };
    const users = await prisma.user.findMany({
      where,
      take: limit ?? 50,
      orderBy: { name: "asc" },
      select: {
        name: true,
        phone: true,
        emptyBottlesHeld: true,
        debtBalance: true,
        creditLimit: true,
      },
    });
    return ok(users);
  },
);

server.registerTool(
  "create_customer",
  {
    description: "Tạo tài khoản khách (mật khẩu trống = 123456).",
    inputSchema: {
      name: z.string(),
      phone: z.string(),
      password: z.string().optional(),
      line: z.string().optional(),
      district: z.string().optional(),
      zoneName: z.string().optional(),
    },
  },
  async ({ name, phone, password, line, district, zoneName }) => {
    if (!/^0\d{8,10}$/.test(phone)) return err("Số điện thoại không hợp lệ");
    if (await prisma.user.findUnique({ where: { phone } }))
      return err("SĐT đã tồn tại");
    const bcrypt = (await import("bcryptjs")).default;
    const zone = zoneName
      ? await prisma.zone.findFirst({ where: { name: { contains: zoneName } } })
      : null;
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        passwordHash: bcrypt.hashSync(password?.trim() || "123456", 10),
        roles: rolesToCsv(["CUSTOMER"]),
        ...(line
          ? {
              addresses: {
                create: {
                  label: "Mặc định",
                  line,
                  district: district ?? null,
                  city: "TP. Hồ Chí Minh",
                  zoneId: zone?.id ?? null,
                  isDefault: true,
                },
              },
            }
          : {}),
      },
    });
    return ok({
      id: user.id,
      name,
      phone,
      password: password?.trim() || "123456",
    });
  },
);

server.registerTool(
  "list_products",
  { description: "Liệt kê sản phẩm." },
  async () => {
    const products = await prisma.product.findMany({
      orderBy: [{ isActive: "desc" }, { type: "asc" }],
    });
    return ok(
      products.map((p) => ({
        sku: p.sku,
        name: p.name,
        type: p.type,
        price: p.price,
        depositPrice: p.depositPrice,
        isReturnable: p.isReturnable,
        stock: p.stock,
        isActive: p.isActive,
      })),
    );
  },
);

server.registerTool(
  "set_product",
  {
    description: "Tạo/cập nhật sản phẩm theo SKU.",
    inputSchema: {
      sku: z.string(),
      name: z.string().optional(),
      type: z.string().optional(),
      unit: z.string().optional(),
      price: z.number().optional(),
      depositPrice: z.number().optional(),
      isReturnable: z.boolean().optional(),
      stock: z.number().optional(),
      isActive: z.boolean().optional(),
    },
  },
  async ({ sku, ...rest }) => {
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      const updated = await prisma.product.update({
        where: { sku },
        data: rest,
      });
      return ok({ updated: updated.sku });
    }
    if (rest.name == null || rest.price == null)
      return err("Tạo mới cần name và price");
    const created = await prisma.product.create({
      data: {
        sku,
        name: rest.name,
        type: rest.type ?? "KHAC",
        unit: rest.unit ?? "cái",
        price: rest.price,
        depositPrice: rest.depositPrice ?? 0,
        isReturnable: rest.isReturnable ?? false,
        stock: rest.stock ?? 0,
        isActive: rest.isActive ?? true,
      },
    });
    return ok({ created: created.sku });
  },
);

server.registerTool(
  "list_users",
  {
    description: "Liệt kê người dùng nội bộ + vai trò (tìm theo tên/SĐT).",
    inputSchema: { search: z.string().optional() },
  },
  async ({ search }) => {
    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {},
      orderBy: { name: "asc" },
      select: { name: true, phone: true, roles: true, isActive: true },
    });
    return ok(
      users.map((u) => ({
        name: u.name,
        phone: u.phone,
        roles: parseRoles(u.roles),
        isActive: u.isActive,
      })),
    );
  },
);

server.registerTool(
  "set_user_roles",
  {
    description: `Đặt vai trò cho user theo SĐT. roles là mảng con của: ${ROLES.join(", ")}.`,
    inputSchema: { phone: z.string(), roles: z.array(z.string()) },
  },
  async ({ phone, roles }) => {
    const u = await prisma.user.findUnique({ where: { phone } });
    if (!u) return err("Không tìm thấy " + phone);
    const valid = ROLES.filter((r) => roles.includes(r));
    if (valid.length === 0) return err("Cần ít nhất 1 vai trò hợp lệ");
    await prisma.user.update({
      where: { id: u.id },
      data: { roles: rolesToCsv(valid) },
    });
    return ok({ phone, roles: valid });
  },
);

server.registerTool(
  "run_due_subscriptions",
  { description: "Chạy các lịch đặt định kỳ đến hạn -> tạo đơn." },
  async () => {
    const now = new Date();
    const due = await prisma.subscription.findMany({
      where: { isActive: true, nextRunAt: { lte: now } },
      include: { customer: { include: { addresses: true } }, product: true },
    });
    let created = 0;
    for (const sub of due) {
      const addressId =
        sub.addressId ??
        sub.customer.addresses.find((a) => a.isDefault)?.id ??
        sub.customer.addresses[0]?.id;
      if (addressId && sub.product.isActive) {
        try {
          await createOrder(
            sub.customerId,
            addressId,
            [{ productId: sub.productId, qty: sub.qty }],
            "COD",
            "Đơn đặt định kỳ (MCP)",
          );
          created++;
        } catch {
          // bỏ qua lịch lỗi
        }
      }
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          nextRunAt: advanceUntilFuture(
            sub.nextRunAt!,
            sub.frequency as "WEEKLY" | "BIWEEKLY" | "MONTHLY",
            now,
          ),
        },
      });
    }
    return ok({ processed: due.length, created });
  },
);

server.registerTool(
  "list_error_logs",
  {
    description: "Liệt kê nhật ký lỗi (chỉ chưa xử lý nếu unresolvedOnly).",
    inputSchema: {
      unresolvedOnly: z.boolean().optional(),
      limit: z.number().int().positive().max(200).optional(),
    },
  },
  async ({ unresolvedOnly, limit }) => {
    const logs = await prisma.errorLog.findMany({
      where: unresolvedOnly ? { resolved: false } : {},
      orderBy: { createdAt: "desc" },
      take: limit ?? 50,
      select: {
        level: true,
        source: true,
        message: true,
        url: true,
        resolved: true,
        createdAt: true,
      },
    });
    return ok(logs);
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[goinuoc-mcp] MCP server đã chạy (stdio).");
}
main().catch((e) => {
  console.error("[goinuoc-mcp] lỗi:", e);
  process.exit(1);
});
