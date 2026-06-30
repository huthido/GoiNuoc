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

# Health check (Coolify hiển thị "healthy" thay vì "unknown"). Dùng node fetch (không cần curl).
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "start"]
