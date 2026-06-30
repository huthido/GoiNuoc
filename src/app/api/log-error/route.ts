import { logError } from "@/lib/error-log";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Nhận lỗi phía client từ error boundary. Yêu cầu đăng nhập (tránh ghi spam vô danh).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let body: {
    message?: string;
    stack?: string;
    digest?: string;
    url?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    // bỏ qua body lỗi
  }

  await logError(new Error(String(body.message ?? "Lỗi phía client")), {
    source: "client",
    stack: typeof body.stack === "string" ? body.stack : null,
    digest: typeof body.digest === "string" ? body.digest : undefined,
    url: typeof body.url === "string" ? body.url : undefined,
    userId: user.id,
  });

  return Response.json({ ok: true });
}
