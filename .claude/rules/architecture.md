# Rule: Kiến trúc & phân tầng — Gọi Nước

> Nạp qua import từ `CLAUDE.md`. Áp cho toàn bộ app Next.js (App Router).

## Phân tầng (thực tế project)
- `src/app/**` — **UI**: React Server/Client Components, route, layout. Không viết logic nghiệp vụ
  hay truy vấn phức tạp tại đây; gọi xuống server action / domain.
  - `src/app/(customer)/**` — app khách (mobile-first, PWA).
  - `src/app/admin/**` — trang quản trị (desktop).
  - `src/app/driver/**` — app tài xế (mobile).
- `src/lib/domain/**` — **logic nghiệp vụ thuần** (pricing, bottles, orderStatus). KHÔNG import Next,
  Prisma, React. Nhận/đưa dữ liệu dạng plain object → dễ test bằng Vitest.
- `src/lib/validators/**` — schema Zod cho input ở ranh giới (form, action, API).
- `src/server/**` — **infra/use-case**: Server Actions điều phối domain + DB (Prisma), revalidate.
- `src/lib/db.ts` — Prisma client singleton. `src/lib/auth.ts` — Auth.js.
- `src/app/api/**` — Route Handlers cho việc cần endpoint thật (auth callback, push subscribe).

## Quy tắc phụ thuộc
- Chiều phụ thuộc: `app(UI) → server → lib/domain → (Prisma/infra)`. **domain KHÔNG import app/server/Prisma.**
- Một module = một trách nhiệm. Tránh "file tạp nham".
- Đặt code mới cạnh code cùng loại; tái sử dụng utility/`domain` sẵn có trước khi viết mới.
- Đổi public API (action/domain) → kiểm tra blast radius (`codegraph_impact` nếu có index).

## Khi thêm tính năng
- Ưu tiên **lát cắt dọc** (UI → action → domain → DB cho 1 use-case) thay vì làm xong từng tầng.
- Tiền: integer VND. Trạng thái đơn: chỉ chuyển qua `lib/domain/orderStatus.ts` (máy trạng thái tập trung).
- Mọi thay đổi vỏ bình đi qua `lib/domain/bottles.ts` + ghi `BottleTxn` (không sửa số dư trực tiếp rải rác).
