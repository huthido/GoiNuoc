import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parseRoles } from "@/lib/domain/types";
import { StaffManager } from "@/components/admin/StaffManager";

export const metadata = { title: "Nhân sự · Quản trị" };

export default async function AdminStaffPage() {
  const me = await requireUser(["ADMIN"]);
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { roles: { contains: "ADMIN" } },
        { roles: { contains: "STAFF" } },
        { roles: { contains: "DRIVER" } },
      ],
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true, roles: true, isActive: true },
  });

  return (
    <StaffManager
      currentUserId={me.id}
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        roles: parseRoles(u.roles),
        isActive: u.isActive,
      }))}
    />
  );
}
