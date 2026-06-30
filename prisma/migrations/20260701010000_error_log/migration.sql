-- Bảng nhật ký lỗi (chỉ SUPER_ADMIN xem).
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" TEXT NOT NULL DEFAULT 'ERROR',
    "source" TEXT,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "digest" TEXT,
    "url" TEXT,
    "method" TEXT,
    "userId" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ErrorLog_createdAt_idx" ON "ErrorLog"("createdAt");
CREATE INDEX "ErrorLog_resolved_idx" ON "ErrorLog"("resolved");
