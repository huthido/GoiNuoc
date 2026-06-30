# CLAUDE.md — Gọi Nước (PWA đặt nước đóng bình)

> Giữ NGẮN GỌN. Chỉ ghi thứ Claude cần để làm việc đúng. Rule chi tiết ở `.claude/rules/`.

## Project là gì
PWA đặt nước đóng bình cho **một nhà máy** sản xuất nước uống (bình 20L úp máy, thùng chai…).
Ba mặt trên cùng một app Next.js: **Khách** (đặt nước, PWA mobile), **Admin** (duyệt đơn, phân
tài xế, quản lý sản phẩm/kho/khách/công nợ), **Tài xế** (danh sách giao trong ngày, thu vỏ/tiền).
Nghiệp vụ lõi khác app bán hàng thường: **vỏ bình tuần hoàn + cọc vỏ (sổ vỏ)**, **công nợ**, **tuyến giao**.

## Lệnh thường dùng
- Cài đặt: `npm install`
- Dev: `npm run dev` → http://localhost:3000
- Build: `npm run build`  •  Chạy bản build: `npm start`
- Lint: `npm run lint`
- Test (Vitest): `npm test`  — luôn chạy trước khi báo "đã xong".
- DB (Prisma + SQLite): `npx prisma migrate dev`, `npx prisma db seed`, `npx prisma studio`

## Quy ước cốt lõi
- Stack: **Next.js 16 (App Router) + TypeScript + Tailwind v4 + Prisma/SQLite + Auth.js + Serwist (PWA)**.
- ⚠️ Next.js 16 có breaking changes so với bản cũ — đọc `node_modules/next/dist/docs/` trước khi viết code Next (xem `@AGENTS.md`).
- Tiền lưu **integer VND** (đồng), không dùng số thực.
- Ghi dữ liệu qua **Server Actions** trong `src/server/*`, validate **Zod** ở đầu mỗi action.
- Logic nghiệp vụ thuần (giá, sổ vỏ, trạng thái đơn) nằm ở `src/lib/domain/*`, **có test**, không phụ thuộc Next/Prisma.
- Không tự thêm dependency mới khi chưa hỏi.

## Khi làm việc
- Việc lớn → **plan mode**; làm theo **lát cắt dọc** (UI → domain → infra cho 1 use-case), không làm xong từng tầng ngang.
- Tra cấu trúc code → ưu tiên **codegraph** hơn grep.
- Bắt buộc **chứng minh** thay đổi chạy được (chạy lệnh/test, dán output).
- Feature lớn có thể dùng Spec Kit: `/speckit-specify → plan → tasks → implement` (spec ở `specs/`).

## Rules chi tiết
@.claude/rules/architecture.md
@.claude/rules/patterns.md

## Next.js 16 agent rules
@AGENTS.md
