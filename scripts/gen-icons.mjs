// Sinh icon PWA (PNG) bằng Node thuần — không cần thư viện ảnh.
// Vẽ giọt nước trắng trên nền xanh (theme #0284c7). Xuất ra public/icons/.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "icons");
mkdirSync(OUT, { recursive: true });

// --- CRC32 + PNG encoder ---
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10,11,12 = 0 (compression, filter, interlace)
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter type 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// --- Vẽ giọt nước ---
const BLUE = [2, 132, 199]; // #0284c7
const LIGHT = [56, 189, 248]; // #38bdf8 (gradient nhẹ)
const WHITE = [255, 255, 255];

function inDroplet(x, y, S, scale) {
  // Hệ tọa độ chuẩn hóa quanh tâm, scale = tỉ lệ kích thước giọt.
  const cx = S / 2;
  const R = S * 0.22 * scale;
  const cy = S * 0.60; // tâm phần tròn
  const tipY = cy - S * 0.40 * scale; // đỉnh giọt
  // phần tròn
  const dx = x - cx;
  const dy = y - cy;
  if (dx * dx + dy * dy <= R * R) return true;
  // phần tam giác thuôn lên đỉnh
  if (y >= tipY && y <= cy) {
    const halfW = (R * (y - tipY)) / (cy - tipY);
    if (Math.abs(x - cx) <= halfW) return true;
  }
  return false;
}

function makeIcon(S, { maskable }) {
  const rgba = Buffer.alloc(S * S * 4);
  const dropScale = maskable ? 0.82 : 1.0; // maskable: thu nhỏ vào vùng an toàn
  const radius = maskable ? 0 : S * 0.22; // bo góc cho icon thường
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      // nền bo góc (với icon thường); ngoài vùng -> trong suốt
      let bg = true;
      if (radius > 0) {
        const rx = Math.min(x, S - 1 - x);
        const ry = Math.min(y, S - 1 - y);
        if (rx < radius && ry < radius) {
          const ddx = radius - rx;
          const ddy = radius - ry;
          if (ddx * ddx + ddy * ddy > radius * radius) bg = false;
        }
      }
      let col;
      let a = 255;
      if (!bg) {
        a = 0;
        col = WHITE;
      } else if (inDroplet(x, y, S, dropScale)) {
        col = WHITE;
      } else {
        // gradient dọc từ LIGHT (trên) -> BLUE (dưới)
        const t = y / S;
        col = [
          Math.round(LIGHT[0] + (BLUE[0] - LIGHT[0]) * t),
          Math.round(LIGHT[1] + (BLUE[1] - LIGHT[1]) * t),
          Math.round(LIGHT[2] + (BLUE[2] - LIGHT[2]) * t),
        ];
      }
      rgba[i] = col[0];
      rgba[i + 1] = col[1];
      rgba[i + 2] = col[2];
      rgba[i + 3] = a;
    }
  }
  return encodePNG(S, S, rgba);
}

const targets = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "maskable-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: true },
];
for (const t of targets) {
  writeFileSync(join(OUT, t.file), makeIcon(t.size, { maskable: t.maskable }));
  console.log("wrote", t.file);
}
console.log("Done -> public/icons/");
