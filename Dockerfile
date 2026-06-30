# syntax=docker/dockerfile:1

# ---------- Builder ----------
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Công cụ build cho better-sqlite3 (node-gyp) nếu không có prebuild
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Sinh Prisma Client (thư mục src/generated bị gitignore)
RUN npx prisma generate
# Build Next.js (dùng --webpack theo package.json vì Serwist)
RUN npm run build

# ---------- Runner ----------
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    DATABASE_URL="file:/app/data/prod.db" \
    SEED_ON_FIRST_BOOT=true

# Thư mục dữ liệu — mount persistent volume vào đây trên Coolify
RUN mkdir -p /app/data

# Copy app đã build + node_modules (gồm Prisma Client đã generate, better-sqlite3, CLI prisma/tsx)
COPY --from=builder /app ./
# Chuẩn hóa LF (phòng file được commit dạng CRLF trên Windows) + cấp quyền chạy
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "start"]
