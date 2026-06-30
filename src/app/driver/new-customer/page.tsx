import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { CustomerCreate } from "@/components/CustomerCreate";

export const metadata = { title: "Thêm khách · Tài xế" };

export default async function DriverNewCustomerPage() {
  await requireUser(["DRIVER"]);
  const zones = await prisma.zone.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="space-y-4 p-4">
      <Link href="/driver" className="inline-flex items-center text-sm text-gray-500">
        <ChevronLeft className="h-4 w-4" /> Danh sách giao
      </Link>
      <h1 className="text-lg font-bold text-gray-900">Thêm khách mới</h1>
      <CustomerCreate zones={zones} defaultOpen />
    </div>
  );
}
