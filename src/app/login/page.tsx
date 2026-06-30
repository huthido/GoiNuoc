import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/session";
import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Đăng nhập · Gọi Nước" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.roles));

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-sky-50 to-slate-100 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-3xl text-white shadow-lg">
            💧
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Gọi Nước</h1>
          <p className="text-sm text-gray-500">Đặt nước đóng bình giao tận nơi</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
