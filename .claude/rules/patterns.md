# Rule: Convention code & test — Gọi Nước

> Nạp qua import từ `CLAUDE.md`. Convention cho Next.js + TS + Prisma.

## Code style
- Tuân theo style của code lân cận (đặt tên, độ dày comment, idiom). Không áp style mới.
- TypeScript chặt: tránh `any`; ưu tiên type suy ra từ Zod (`z.infer`) và Prisma.
- Server Component mặc định; chỉ thêm `"use client"` khi cần state/sự kiện trình duyệt.
- Tên tiếng Anh cho code (biến/hàm/bảng), tiếng Việt cho nhãn UI hiển thị cho người dùng.
- Không để lại `console.log`/debug print khi commit.

## Xử lý lỗi & validate
- Validate đầu vào ở ranh giới bằng **Zod** (form, server action, route handler) trước khi chạm DB.
- Không "nuốt" lỗi im lặng. Server action trả `{ ok, error }` rõ ràng; UI hiển thị thông báo.
- Tiền tệ: integer VND. Mọi tính tiền/giá đi qua `lib/domain/pricing.ts`.

## Testing (Vitest)
- Test trọng tâm cho **domain thuần**: `pricing`, `bottles`, `orderStatus` (không cần DB).
- Mỗi bug fix kèm 1 test tái hiện bug.
- Chạy `npm test` trước khi báo "đã xong"; dán output để chứng minh.

## Dữ liệu & Prisma
- Truy vấn qua `src/lib/db.ts` (singleton). Ghi dữ liệu trong server action, dùng transaction khi
  một thao tác đụng nhiều bảng (vd. giao hàng: Order + BottleTxn + công nợ).
- Sau migrate/đổi schema: chạy `npx prisma generate`.

## Commit
- Conventional Commits (`feat:`, `fix:`, `refactor:`…). Xem skill `commit-helper`.
- Commit nhỏ, theo từng lát cắt dọc hoàn chỉnh.
