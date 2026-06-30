#!/usr/bin/env bash
# Hook — chạy sau khi Claude sửa file (PostToolUse, matcher Edit|Write).
# Tham chiếu từ ../settings.json. Format CHỈ file vừa sửa bằng Prettier (nhanh, không quét cả repo).
# Là no-op an toàn nếu prettier chưa được cài (npx --no-install) hoặc file không hợp lệ.

set -euo pipefail

payload="$(cat || true)"

# Lấy đường dẫn file bị sửa từ payload JSON (node luôn có sẵn trong project Next).
file="$(printf '%s' "$payload" | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.tool_input&&j.tool_input.file_path)||"")}catch{process.stdout.write("")}})' 2>/dev/null || true)"

# Chỉ format các loại file Prettier hiểu, và chỉ khi file tồn tại.
case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.css|*.json|*.md)
    [ -f "$file" ] && npx --no-install prettier --write "$file" >/dev/null 2>&1 || true
    ;;
esac

exit 0
