import { runDueSubscriptions } from "@/lib/subscriptions-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Chạy các lịch định kỳ đến hạn. Bảo vệ bằng CRON_SECRET (Bearer hoặc ?key=).
// Nếu CRON_SECRET chưa set (vd. local) thì cho chạy tự do để tiện thử.
async function handle(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const key = header ?? new URL(req.url).searchParams.get("key");
    if (key !== secret) return new Response("Unauthorized", { status: 401 });
  }
  const result = await runDueSubscriptions();
  return Response.json({ ok: true, ...result });
}

export function GET(req: Request) {
  return handle(req);
}
export function POST(req: Request) {
  return handle(req);
}
