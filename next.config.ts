import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  // better-sqlite3 là native addon -> không bundle, để runtime tự require.
  serverExternalPackages: ["better-sqlite3"],
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Tắt service worker khi dev cho đỡ vướng; chỉ sinh SW ở bản build.
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
