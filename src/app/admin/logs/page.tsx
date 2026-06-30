import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { LogViewer } from "@/components/admin/LogViewer";

export const metadata = { title: "Nhật ký lỗi · Quản trị" };

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireUser(["SUPER_ADMIN"]);
  const { filter } = await searchParams;
  const where = filter === "unresolved" ? { resolved: false } : {};

  const [logs, unresolvedCount] = await Promise.all([
    prisma.errorLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.errorLog.count({ where: { resolved: false } }),
  ]);

  return (
    <LogViewer
      filter={filter}
      unresolvedCount={unresolvedCount}
      logs={logs.map((l) => ({
        id: l.id,
        level: l.level,
        source: l.source,
        message: l.message,
        stack: l.stack,
        url: l.url,
        userId: l.userId,
        resolved: l.resolved,
        createdAt: l.createdAt.toISOString(),
      }))}
    />
  );
}
