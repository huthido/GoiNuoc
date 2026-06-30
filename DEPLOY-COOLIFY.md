# Triển khai Gọi Nước trên Coolify

App đóng gói bằng **Dockerfile** (multi-stage). DB là **SQLite** nên cần **persistent volume**
mount vào `/app/data`. Đã cấu hình **zero-config**:

- **Persistent storage tự tạo**: dùng build pack *Docker Compose* → Coolify tự tạo & giữ volume `goinuoc-data`.
- **AUTH_SECRET tự sinh**: `docker-entrypoint.sh` tự sinh secret và lưu bền trên volume nếu chưa được set.
- **Migration + seed demo** chạy tự động lần đầu.

## Yêu cầu
- Một instance Coolify đang chạy, đã kết nối GitHub (repo `huthido/GoiNuoc`).
- Một tên miền trỏ về Coolify (Coolify tự cấp HTTPS).

---

## Cách A — Build pack "Docker Compose" (KHUYẾN NGHỊ — zero config)

Tự lo cả volume bền lẫn secret, gần như chỉ cần bấm Deploy.

1. **New Resource → Docker Compose** → chọn repo `huthido/GoiNuoc`, branch `main`.
2. Coolify đọc `docker-compose.yml`:
   - Volume **`goinuoc-data` → `/app/data`** được **tự tạo** và giữ bền qua các lần deploy.
   - **`AUTH_SECRET` tự sinh** trong entrypoint (lưu vào `/app/data/.auth_secret`).
   - `DATABASE_URL`, `AUTH_TRUST_HOST`, `SEED_ON_FIRST_BOOT` đã set sẵn.
3. Đặt **Domain** cho service `app` (port 3000) trong UI Coolify.
4. **Deploy.** Xong.

> Không cần thêm biến môi trường hay tạo storage thủ công.
> Nếu muốn tự quản secret: thêm biến `AUTH_SECRET` trong Coolify → entrypoint sẽ ưu tiên dùng.

---

## Cách B — Build pack "Dockerfile"

Secret vẫn **tự sinh**, nhưng volume phải thêm 1 lần trong UI (Dockerfile không tự khai báo volume bền cho Coolify).

1. New Resource → **Application** → repo `huthido/GoiNuoc`, branch `main`.
2. **Build Pack: `Dockerfile`**, **Port: `3000`**.
3. **Persistent Storage:** thêm volume **Mount Path = `/app/data`** (giữ DB + secret qua redeploy).
4. (Tùy chọn) Env: `SEED_ON_FIRST_BOOT=false` nếu không muốn dữ liệu demo. `AUTH_SECRET`/`DATABASE_URL`
   để mặc định cũng được (entrypoint tự lo).
5. Đặt Domain → **Deploy**.

---

## Tài khoản demo sau khi seed (mật khẩu `123456`)
Admin `0900000001` · Tài xế `0900000011` · Khách `0911111111`.
> Production thật: đăng nhập đổi/khóa tài khoản demo, hoặc đặt `SEED_ON_FIRST_BOOT=false`.

## Chạy thử local bằng Docker
```bash
docker compose up --build      # AUTH_SECRET tự sinh, mở http://localhost:3000
```

## Ghi chú
- **Secret bền**: lưu ở `/app/data/.auth_secret` trên volume → ổn định qua restart/redeploy.
  Đổi secret = xóa file này (sẽ sinh lại, làm mất các phiên đăng nhập hiện tại).
- **Health check**: `GET /api/health` → `{ ok: true, db: "up" }`.
- **Backup**: sao lưu thư mục volume `/app/data` (gồm `prod.db` + `.auth_secret`).
- **Đổi sang Postgres**: đổi `provider` trong `prisma/schema.prisma`, dùng adapter `@prisma/adapter-pg`
  trong `src/lib/db.ts`, set `DATABASE_URL` Postgres; bỏ volume SQLite.
