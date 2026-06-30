#!/bin/sh
# Entrypoint: áp migration lên DB bền, seed demo lần đầu (1 lần), rồi chạy app.
set -e

echo "[entrypoint] DATABASE_URL=$DATABASE_URL"
echo "[entrypoint] prisma migrate deploy..."
npx prisma migrate deploy

# Seed dữ liệu demo CHỈ lần đầu (đánh dấu bằng file trên volume bền /app/data).
if [ "${SEED_ON_FIRST_BOOT:-true}" = "true" ] && [ ! -f /app/data/.seeded ]; then
  echo "[entrypoint] Lần đầu khởi động -> seed dữ liệu demo"
  if npx prisma db seed; then
    touch /app/data/.seeded
    echo "[entrypoint] Seed xong."
  else
    echo "[entrypoint] Seed lỗi (bỏ qua, không chặn khởi động)."
  fi
fi

echo "[entrypoint] Khởi động app: $*"
exec "$@"
