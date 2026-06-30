# Gọi Nước 💧 — PWA đặt nước đóng bình

Hệ thống đặt nước đóng bình cho **một nhà máy** sản xuất nước uống (bình 20L úp máy, thùng chai…).
Một app Next.js, ba mặt:

- **Khách** (PWA, mobile-first): đặt nước, đặt lại đơn cũ, theo dõi đơn, xem sổ vỏ & công nợ.
- **Admin** (desktop): duyệt đơn, phân tài xế, quản lý sản phẩm/giá/kho, khách hàng, khu vực, báo cáo.
- **Tài xế** (mobile): danh sách giao trong ngày, cập nhật trạng thái, thu vỏ & tiền.

Nghiệp vụ lõi khác app bán hàng thường: **vỏ bình tuần hoàn + cọc vỏ (sổ vỏ)**, **công nợ**, **tuyến giao**.

## Công nghệ
Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma 7 + SQLite (driver adapter better-sqlite3) ·
Auth.js v5 (Credentials) · Serwist (PWA) · Zustand · Zod · Vitest.

> Tiền lưu **integer VND**. Logic nghiệp vụ thuần ở `src/lib/domain/*` (có test). Ghi dữ liệu qua
> Server Actions (`src/server/*`). Xem `CLAUDE.md` + `.claude/rules/` để biết quy ước.

## Chạy dự án
```bash
npm install
npx prisma migrate dev      # tạo DB SQLite (prisma/dev.db)
npm run db:seed             # nạp dữ liệu mẫu + in tài khoản demo
npm run dev                 # http://localhost:3000  (dùng webpack, xem ghi chú PWA)
```
Bản production: `npm run build && npm start`.

> ⚠️ **PWA dùng webpack:** Serwist tiêm cấu hình webpack, trong khi Next 16 mặc định Turbopack.
> Vì vậy `dev`/`build` đã cấu hình cờ `--webpack` trong `package.json`. Đừng bỏ cờ này.

## Tài khoản demo (mật khẩu: `123456`)
| Vai trò | Số điện thoại |
|---|---|
| Admin | `0900000001` |
| Nhân viên | `0900000002` |
| Tài xế (Hùng / Khoa) | `0900000011` / `0900000012` |
| Khách (An) | `0911111111` |
| Khách (VP ABC, có công nợ) | `0922222222` |
| Khách (Quán cà phê) | `0944444444` |

## Luồng thử end-to-end
1. Đăng nhập **khách** → thêm bình 20L vào giỏ → đặt hàng (đơn `Chờ xác nhận`).
2. Đăng nhập **admin** → mở đơn → **Xác nhận** → **Phân tài xế**.
3. Đăng nhập **tài xế** → đơn hôm nay → **Bắt đầu giao** → nhập số vỏ thu → **Hoàn tất giao**.
4. Kiểm tra: đơn `Đã giao`, **sổ vỏ** và **công nợ** của khách cập nhật đúng; cọc vỏ tính lại theo số vỏ trả.

## Lệnh hữu ích
```bash
npm test          # test domain (pricing, sổ vỏ, máy trạng thái đơn)
npm run lint
npm run db:studio # xem dữ liệu (Prisma Studio)
npm run db:reset  # reset + seed lại
```

## Cấu trúc
```
src/
  app/(customer|admin|driver)/   # 3 mặt UI (App Router)
  app/login  app/api  app/manifest.ts  app/sw.ts
  lib/domain/{pricing,bottles,orderStatus}.ts   # logic thuần + test
  lib/{db,auth,session,format,labels}.ts
  server/{orders,admin,deliveries,auth-actions}.ts   # Server Actions
  components/{customer,admin,driver,...}
prisma/{schema.prisma, seed.ts}
specs/001-dat-nuoc/             # đặc tả Spec Kit (spec, plan, tasks)
```

## Định hướng tiếp theo (Phase 2)
Đặt định kỳ (Subscription), Push notification (web-push/VAPID), thanh toán online, đăng nhập OTP SMS.
Đổi sang Postgres: chỉ đổi `provider` + cấu hình adapter; schema giữ nguyên.
