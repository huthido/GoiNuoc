# Implementation Plan: Gọi Nước (001-dat-nuoc)

**Spec**: ./spec.md  •  **Constitution**: ../../.specify/memory/constitution.md

## Technical Context
- **Stack**: Next.js 16 (App Router) + TypeScript + Tailwind v4 + Prisma/SQLite + Auth.js (Credentials) + Serwist (PWA) + Zustand (giỏ) + Zod + Vitest.
- **Tiền**: integer VND. **DB**: SQLite dev (đổi Postgres chỉ qua provider/URL).

## Cấu trúc mã nguồn
```
src/
  app/
    (customer)/   # khách: trang chủ, products, cart, checkout, orders, account
    admin/        # dashboard, orders, products, customers, drivers, zones, reports
    driver/       # deliveries (đơn hôm nay + chi tiết giao)
    login/  api/  manifest.ts  sw.ts
  lib/
    domain/{pricing,bottles,orderStatus}.ts   # logic thuần + test
    validators/*.ts                            # Zod
    db.ts  auth.ts  format.ts
  server/{orders,products,customers,drivers,deliveries}.ts   # Server Actions
  components/{ui,customer,admin,driver}/
prisma/{schema.prisma, seed.ts}
public/icons/*
```

## Phân tầng (theo hiến pháp III)
`app(UI) → server(actions) → lib/domain(thuần) → Prisma`. domain không import Next/Prisma/React.

## Domain logic (có test trước)
- `pricing.ts`: `subtotal`, `shippingFee(zone, subtotal)`, `depositTotal = depositPrice × max(0, Σqty − ΣreturnedEmpties)`, `total`.
- `bottles.ts`: cập nhật số dư vỏ khi DELIVERED: `balance += deliveredFull − returnedEmpty`.
- `orderStatus.ts`: `canTransition(from,to,role)`; máy trạng thái PENDING→CONFIRMED→ASSIGNED→DELIVERING→DELIVERED (+CANCELLED/FAILED).

## Thứ tự build (lát cắt dọc)
Xem ./tasks.md.

## Rủi ro
- Auth.js v5 beta → fallback cookie+JWT (jose) nếu vướng.
- Serwist + Next 16: chỉ bật SW ở production build; dev không cần SW.
- SQLite: enum lưu string, tiền integer.
