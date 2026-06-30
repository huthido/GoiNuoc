import { getVapidPublicKey } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Trả VAPID public key cho client subscribe (null nếu chưa cấu hình push).
export function GET() {
  return Response.json({ key: getVapidPublicKey() });
}
