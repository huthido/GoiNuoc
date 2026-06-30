#!/bin/sh
# Entrypoint: tự sinh secret + áp migration + seed demo lần đầu, rồi chạy app.
# Mục tiêu: zero-config — không cần đặt AUTH_SECRET hay tạo volume thủ công.
set -e

DATA_DIR=/app/data
mkdir -p "$DATA_DIR"

# --- AUTH_SECRET: dùng env nếu có; nếu không, tự sinh & lưu BỀN trên volume ---
SECRET_FILE="$DATA_DIR/.auth_secret"
if [ -z "$AUTH_SECRET" ]; then
  if [ -f "$SECRET_FILE" ]; then
    AUTH_SECRET=$(cat "$SECRET_FILE")
    echo "[entrypoint] Dùng AUTH_SECRET đã lưu trên volume"
  else
    AUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('base64'))")
    printf '%s' "$AUTH_SECRET" > "$SECRET_FILE"
    chmod 600 "$SECRET_FILE" 2>/dev/null || true
    echo "[entrypoint] Đã tự sinh AUTH_SECRET mới và lưu bền vào volume"
  fi
  export AUTH_SECRET
fi
# Auth.js sau reverse proxy (Coolify/Traefik)
export AUTH_TRUST_HOST="${AUTH_TRUST_HOST:-true}"

echo "[entrypoint] DATABASE_URL=$DATABASE_URL"
echo "[entrypoint] prisma migrate deploy..."
npx prisma migrate deploy

# Seed dữ liệu demo CHỈ lần đầu (đánh dấu bằng file trên volume bền).
if [ "${SEED_ON_FIRST_BOOT:-true}" = "true" ] && [ ! -f "$DATA_DIR/.seeded" ]; then
  echo "[entrypoint] Lần đầu khởi động -> seed dữ liệu demo"
  if npx prisma db seed; then
    touch "$DATA_DIR/.seeded"
    echo "[entrypoint] Seed xong."
  else
    echo "[entrypoint] Seed lỗi (bỏ qua, không chặn khởi động)."
  fi
fi

echo "[entrypoint] Khởi động app: $*"
exec "$@"
