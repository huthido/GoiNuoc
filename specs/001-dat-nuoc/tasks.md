# Tasks: Gọi Nước (001-dat-nuoc)

Mỗi nhóm là một lát cắt dọc chạy được. P1 = MVP.

## T0 — Nền tảng (DONE)
- [x] Scaffold Next.js + Tailwind + TS
- [x] Rải `.claude/` skeleton + tùy biến CLAUDE.md/rules/hook
- [x] git init + Spec Kit (constitution + spec/plan/tasks)

## T1 — Hạ tầng app & PWA (slice 0)
- [ ] Cài deps: prisma, @prisma/client, next-auth@beta, zod, zustand, @serwist/next, serwist, lucide-react, bcryptjs, vitest, prettier
- [ ] `lib/db.ts` (Prisma singleton), `lib/format.ts` (VND), cấu hình Vitest
- [ ] PWA: `manifest.ts` + Serwist `sw.ts` + `next.config` + icon + offline page → app cài được

## T2 — Dữ liệu & domain (P1)
- [ ] `prisma/schema.prisma` đầy đủ model; `migrate dev`
- [ ] `lib/domain/{pricing,bottles,orderStatus}.ts` + test Vitest (xanh)
- [ ] `prisma/seed.ts`: admin/2 tài xế/5 khách/8 sản phẩm/3 zone/đơn mẫu + in tài khoản demo

## T3 — Auth + khung 3 layout (P1)
- [ ] `lib/auth.ts` (Credentials, role trong session) + `/login`
- [ ] middleware bảo vệ `/admin/*`, `/driver/*`; layout + điều hướng theo vai trò

## T4 — Khách đặt nước (US1, P1)
- [ ] Trang chủ + danh mục + chi tiết; giỏ (zustand persist)
- [ ] Checkout → `server/orders.createOrder` (PENDING) với pricing
- [ ] "Đơn của tôi" + theo dõi trạng thái; "Đặt lại"; account (sổ vỏ, công nợ)

## T5 — Admin (US2, P1)
- [ ] Dashboard; danh sách đơn + xác nhận/hủy/phân tài xế (`server/orders`)
- [ ] CRUD sản phẩm/giá/cọc/tồn; khách + công nợ + sổ vỏ; tài xế; zone
- [ ] Báo cáo doanh thu/sản lượng cơ bản

## T6 — Tài xế (US3, P2)
- [ ] Đơn hôm nay; chi tiết giao → cập nhật trạng thái + thu vỏ/tiền (`server/deliveries`)
- [ ] Giao dịch transaction: Order + BottleTxn + công nợ + emptyBottlesHeld

## T7 — Hoàn thiện & kiểm chứng
- [ ] Push notification (web-push/VAPID) — Phase 2 nếu kịp
- [ ] Đặt định kỳ (Subscription) — Phase 2
- [ ] E2E thủ công 1 đơn qua 3 vai; `npm test` + `npm run build` xanh; Lighthouse PWA
