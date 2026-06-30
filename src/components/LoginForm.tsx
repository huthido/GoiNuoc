"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/server/auth-actions";

const DEMO = [
  { label: "Khách (An)", phone: "0911111111" },
  { label: "Admin", phone: "0900000001" },
  { label: "Tài xế (Hùng)", phone: "0900000011" },
];

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Số điện thoại</label>
        <input
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="username"
          required
          placeholder="09xxxxxxxx"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-sky-200"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-sky-200"
        />
      </div>

      {state.error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>

      <div className="rounded-lg bg-slate-50 p-3 text-xs text-gray-500">
        <p className="mb-1 font-medium text-gray-600">Tài khoản demo (mật khẩu: 123456)</p>
        <ul className="space-y-0.5">
          {DEMO.map((d) => (
            <li key={d.phone}>
              {d.label}: <span className="font-mono">{d.phone}</span>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
