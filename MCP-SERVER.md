# MCP Server quản trị Gọi Nước

Một MCP server (stdio) kết nối **thẳng vào DB** (Prisma) và tái dùng domain logic của app, cho phép
trợ lý AI (Claude Code/Desktop) **quản trị toàn bộ ứng dụng** bằng hội thoại.

## Chạy

```bash
npm run mcp        # = tsx mcp/server.ts (đọc DATABASE_URL từ .env)
```

## Khai báo trong client MCP

Dự án đã có sẵn `.mcp.json` (Claude Code tự nạp khi mở thư mục này). Hoặc thêm thủ công:

```json
{
  "mcpServers": {
    "goinuoc-admin": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
      "env": { "DATABASE_URL": "file:./prisma/dev.db" }
    }
  }
}
```

> Trỏ `DATABASE_URL` tới DB muốn quản trị (vd. file production trên server, hoặc Postgres sau này).
> Đây là công cụ quyền **quản trị** — chỉ dùng ở môi trường tin cậy.

## Bộ công cụ (tools)

| Tool                                 | Việc                                                                                                 |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `get_stats`                          | Tổng quan: đơn theo trạng thái, doanh thu, công nợ, vỏ lưu hành, lỗi chưa xử lý                      |
| `list_orders`                        | Liệt kê đơn (lọc theo trạng thái)                                                                    |
| `get_order`                          | Chi tiết đơn theo mã                                                                                 |
| `set_order_status`                   | Đổi trạng thái: confirm / assign / start / deliver / cancel / fail (deliver tính vỏ + cọc + công nợ) |
| `list_customers` / `create_customer` | Xem / tạo nhanh khách                                                                                |
| `list_products` / `set_product`      | Xem / tạo-cập nhật sản phẩm theo SKU                                                                 |
| `list_users` / `set_user_roles`      | Xem người dùng / gán vai trò (đa vai trò)                                                            |
| `run_due_subscriptions`              | Chạy lịch đặt định kỳ đến hạn                                                                        |
| `list_error_logs`                    | Xem nhật ký lỗi                                                                                      |

## Ví dụ yêu cầu

- "Cho xem thống kê hệ thống" → `get_stats`
- "Liệt kê đơn đang chờ xác nhận" → `list_orders status=PENDING`
- "Xác nhận đơn GN0010 rồi phân cho tài xế 0900000011" → `set_order_status` (confirm) + (assign)
- "Tạo khách Trần Văn B, SĐT 0987654321, khu vực Thủ Đức" → `create_customer`
- "Cho 0900000003 thêm vai trò STAFF" → `set_user_roles`

## Ghi chú

- Server tự tạo Prisma client riêng (adapter better-sqlite3) + tái dùng domain thuần (pricing, máy trạng thái,
  sổ vỏ, lịch định kỳ) để số liệu nhất quán với app.
- Không đi qua lớp đăng nhập của web — vì vậy chỉ chạy nơi tin cậy; quyền tương đương admin/super admin.
