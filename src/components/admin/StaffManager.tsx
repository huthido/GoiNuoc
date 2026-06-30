"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { createStaff, setUserRoles, toggleStaffActive } from "@/server/staff";
import { ROLES, type Role } from "@/lib/domain/types";
import { ROLE_LABELS } from "@/lib/labels";

export interface StaffUser {
  id: string;
  name: string;
  phone: string;
  roles: Role[];
  isActive: boolean;
}

export function StaffManager({ users, currentUserId }: { users: StaffUser[]; currentUserId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ name: string; phone: string; password: string; roles: Role[] }>({
    name: "",
    phone: "",
    password: "",
    roles: ["STAFF"],
  });

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res.ok) {
        after?.();
        router.refresh();
      } else {
        setError(res.error ?? "Có lỗi xảy ra");
      }
    });
  }

  function toggleRole(user: StaffUser, role: Role) {
    const next = user.roles.includes(role) ? user.roles.filter((r) => r !== role) : [...user.roles, role];
    run(() => setUserRoles(user.id, next));
  }

  function toggleFormRole(role: Role) {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
    }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Nhân sự & vai trò</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white">
            <UserPlus className="h-4 w-4" /> Thêm
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500">
        Một tài khoản có thể có nhiều vai trò (vd. <b>Admin + Tài xế</b>). Tích/bỏ tích để đổi vai trò.
      </p>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      {showForm && (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <p className="font-semibold text-gray-900">Tài khoản nội bộ mới</p>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Tên" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
            <input placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
            <input placeholder="Mật khẩu (trống = 123456)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={`${input} col-span-2`} />
          </div>
          <div className="flex flex-wrap gap-3">
            {ROLES.map((r) => (
              <label key={r} className="flex items-center gap-1.5 text-sm text-gray-700">
                <input type="checkbox" checked={form.roles.includes(r)} onChange={() => toggleFormRole(r)} className="accent-sky-600" />
                {ROLE_LABELS[r]}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              disabled={pending}
              onClick={() => run(() => createStaff({ name: form.name, phone: form.phone, password: form.password || undefined, roles: form.roles }), () => { setShowForm(false); setForm({ name: "", phone: "", password: "", roles: ["STAFF"] }); })}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Đang lưu…" : "Tạo"}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-600">
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="divide-y">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
              <div className="min-w-[35%] flex-1">
                <p className="font-semibold text-gray-900">
                  {u.name}
                  {u.id === currentUserId && <span className="ml-1 text-xs text-gray-400">(bạn)</span>}
                  {!u.isActive && <span className="ml-1 rounded bg-gray-200 px-1.5 text-[11px] text-gray-500">Khóa</span>}
                </p>
                <p className="text-xs text-gray-400">{u.phone}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      disabled={pending}
                      checked={u.roles.includes(r)}
                      onChange={() => toggleRole(u, r)}
                      className="accent-sky-600"
                    />
                    {ROLE_LABELS[r]}
                  </label>
                ))}
              </div>
              {u.id !== currentUserId && (
                <button
                  disabled={pending}
                  onClick={() => run(() => toggleStaffActive(u.id))}
                  className="rounded-lg border px-2.5 py-1 text-xs font-medium text-gray-600 disabled:opacity-60"
                >
                  {u.isActive ? "Khóa" : "Mở"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const input = "rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand";
