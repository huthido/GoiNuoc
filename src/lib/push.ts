import webpush from "web-push";
import { prisma } from "@/lib/db";

// VAPID đọc từ env lúc runtime (entrypoint tự sinh & export). Local không set -> push tắt êm.
function vapid() {
  return {
    publicKey: process.env.VAPID_PUBLIC_KEY ?? "",
    privateKey: process.env.VAPID_PRIVATE_KEY ?? "",
    subject: process.env.VAPID_SUBJECT ?? "mailto:admin@goinuoc.local",
  };
}

let configured = false;
function ensureConfigured(): boolean {
  const v = vapid();
  if (!v.publicKey || !v.privateKey) return false;
  if (!configured) {
    webpush.setVapidDetails(v.subject, v.publicKey, v.privateKey);
    configured = true;
  }
  return true;
}

export function isPushConfigured(): boolean {
  const v = vapid();
  return Boolean(v.publicKey && v.privateKey);
}

export function getVapidPublicKey(): string | null {
  return vapid().publicKey || null;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Gửi push tới mọi thiết bị đã đăng ký của một user. Tự dọn subscription chết (404/410). */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        }
      }
    }),
  );
}
