# Gọi Nước Constitution

PWA đặt nước đóng bình cho một nhà máy sản xuất nước uống. Ba mặt: Khách, Admin, Tài xế.

## Core Principles

### I. Vỏ bình & công nợ là first-class (NON-NEGOTIABLE)
Bình 20L là vỏ tuần hoàn. Mọi thay đổi số vỏ khách giữ phải đi qua một sổ cái (`BottleTxn`) —
không sửa số dư rải rác. Tiền cọc vỏ tính trên số vỏ ròng (giao − trả). Công nợ (ghi nợ) là
trạng thái thanh toán hợp lệ song song COD, có số dư truy vết được theo từng đơn.

### II. Mọi đơn truy vết được
Đơn có mã, lịch sử trạng thái, ai phân cho tài xế nào, giao lúc nào, thu bao nhiêu vỏ/tiền.
Chuyển trạng thái đơn chỉ qua máy trạng thái tập trung (`lib/domain/orderStatus.ts`); không nhảy trạng thái tùy tiện.

### III. Tách tầng: UI → server → domain → infra
Logic nghiệp vụ thuần (giá, vỏ, trạng thái) ở `lib/domain/*`, không phụ thuộc Next/Prisma/React.
UI không truy vấn DB trực tiếp; ghi dữ liệu qua Server Action có validate Zod ở ranh giới.

### IV. Test cho domain logic
Pricing, bottles, orderStatus phải có test Vitest (không cần DB). Mỗi bug fix kèm test tái hiện.
`npm test` xanh trước khi coi một lát cắt là "xong".

### V. PWA thật, mobile-first
App khách và tài xế cài được lên màn hình chính, có manifest + service worker + offline fallback.
Đặt hàng mượt trên điện thoại; hành động ghi cần mạng phải báo rõ khi offline.

## Ràng buộc kỹ thuật
- Stack: Next.js 16 (App Router) + TypeScript + Tailwind v4 + Prisma/SQLite + Auth.js + Serwist.
- Tiền lưu **integer VND** (đồng), không số thực.
- Đổi DB sang Postgres sau chỉ bằng đổi `provider` + `DATABASE_URL`; schema giữ tương thích.
- Không thêm dependency mới mà chưa cân nhắc/ hỏi.

## Quy trình phát triển
- Làm theo **lát cắt dọc** (tracer bullet): một use-case chạy end-to-end UI→action→domain→DB rồi mới sang use-case khác.
- Thứ tự ra mắt: Khách + Admin trước; Tài xế kế; Đặt định kỳ + Push notification sau.
- Conventional Commits; commit nhỏ theo từng lát cắt.

## Governance
Hiến pháp này đứng trên các quyết định tình huống. Khi spec/plan/tasks mâu thuẫn với nguyên tắc ở đây,
sửa lại cho khớp hoặc ghi rõ lý do ngoại lệ. Thay đổi nguyên tắc phải cập nhật version + ngày sửa.

**Version**: 1.0.0 | **Ratified**: 2026-06-30 | **Last Amended**: 2026-06-30
