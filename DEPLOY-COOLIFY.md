# Triển khai Gọi Nước trên Coolify

App đóng gói bằng **Dockerfile** (multi-stage). DB là **SQLite** nên cần **persistent volume**
mount vào `/app/data` để dữ liệu sống qua các lần deploy. Migration + seed lần đầu chạy tự động
trong `docker-entrypoint.sh`.

## Yêu cầu
- Một instance Coolify đang chạy, đã kết nối GitHub (repo `huthido/GoiNuoc`).
- Tên miền trỏ về Coolify (Coolify tự cấp HTTPS qua Let's Encrypt).

---

## Cách A — Build pack "Dockerfile" (khuyến nghị)

1. **New Resource → Application → Public/Private Repository** → chọn `huthido/GoiNuoc`, branch `main`.
2. **Build Pack: `Dockerfile`** (Coolify tự nhận `./Dockerfile`).
3. **Port (Ports Exposes): `3000`**.
4. **Environment Variables** (tab Environment):
   | Biến | Giá trị |
   |---|---|
   | `AUTH_SECRET` | chuỗi ngẫu nhiên — sinh bằng `openssl rand -base64 32` |
   | `AUTH_TRUST_HOST` | `true` |
   | `DATABASE_URL` | `file:/app/data/prod.db` |
   | `SEED_ON_FIRST_BOOT` | `true` (đặt `false` nếu không muốn seed demo) |
5. **Persistent Storage (QUAN TRỌNG):** thêm một Volume:
   - Name: `goinuoc-data`
   - Mount Path: `/app/data`
   > Bỏ qua bước này = mất toàn bộ đơn/khách mỗi lần redeploy.
6. **Health Check (tùy chọn):** Path `/api/health`, Port `3000`.
7. Đặt **Domain**, bấm **Deploy**.

Lần deploy đầu: entrypoint chạy `prisma migrate deploy` rồi seed dữ liệu demo (tạo file đánh dấu
`/app/data/.seeded` để không seed lại). Các lần sau chỉ migrate.

---

## Cách B — Build pack "Docker Compose"

Dùng `docker-compose.yml` có sẵn (đã khai báo volume `goinuoc-data` + healthcheck).
1. New Resource → **Docker Compose** → repo `huthido/GoiNuoc`, branch `main`.
2. Coolify đọc `docker-compose.yml`. Đặt env **`AUTH_SECRET`** trong Coolify.
3. Đặt domain → Deploy. Volume `goinuoc-data` được Coolify tạo và giữ bền.

---

## Tài khoản demo sau khi seed (mật khẩu `123456`)
Admin `0900000001` · Tài xế `0900000011` · Khách `0911111111`.
> Production thật: đăng nhập đổi/khóa các tài khoản demo, hoặc đặt `SEED_ON_FIRST_BOOT=false`
> và tự tạo dữ liệu.

## Chạy thử local bằng Docker (tùy chọn)
```bash
export AUTH_SECRET=$(openssl rand -base64 32)
docker compose up --build
# mở http://localhost:3000
```

## Ghi chú
- **Health check**: `GET /api/health` → `{ ok: true, db: "up" }` (200) khi DB sẵn sàng.
- **Đổi sang Postgres** (khi tải lớn): đổi `provider` trong `prisma/schema.prisma`, dùng adapter
  Postgres (`@prisma/adapter-pg`) trong `src/lib/db.ts`, set `DATABASE_URL` Postgres; bỏ volume SQLite.
- **Backup**: chỉ cần sao lưu file `/app/data/prod.db` trên volume.
