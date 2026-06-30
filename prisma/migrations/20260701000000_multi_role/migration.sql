-- Đa vai trò: đổi cột `role` -> `roles` (CSV), GIỮ NGUYÊN dữ liệu hiện có.
-- SQLite >= 3.25 hỗ trợ RENAME COLUMN (giữ type/NOT NULL/DEFAULT).
ALTER TABLE "User" RENAME COLUMN "role" TO "roles";
