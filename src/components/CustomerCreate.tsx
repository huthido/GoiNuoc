"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Check } from "lucide-react";
import { createCustomer } from "@/server/customers";

export interface ZoneOption {
  id: string;
  name: string;
}

const EMPTY = { name: "", phone: "", password: "", line: "", district: "", zoneId: "" };

export function CustomerCreate({ zones, defaultOpen = false }: { zones: ZoneOption[]; defaultOpen?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(defaultOpen);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; phone: string; password: string } | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  function submit() {
    setError(null);
    start(async () => {
      const res = await createCustomer({
        name: form.name,
        phone: form.phone,
        password: form.password || undefined,
        line: form.line || undefined,
        district: form.district || undefined,
        zoneId: form.zoneId || undefined,
      });
      if (res.ok) {
        setDone({ name: form.name.trim(), phone: form.phone.trim(), password: form.password.trim() || "123456" });
        setForm({ ...EMPTY });
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (done) {
    return (
      <div className="space-y-2 rounded-2xl bg-emerald-50 p-4 text-sm shadow-sm">
        <p className="flex items-center gap-1.5 font-semibold text-emerald-800">
          <Check className="h-4 w-4" /> Đã tạo khách {done.name}
        </p>
        <p className="text-emerald-700">
          SĐT: <span className="font-mono">{done.phone}</span> · Mật khẩu: <b>{done.password}</b>
          <br />
          <span className="text-xs text-emerald-600">Hãy báo khách để đăng nhập và đổi mật khẩu.</span>
        </p>
        <button
          onClick={() => {
            setDone(null);
            setOpen(true);
          }}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white"
        >
          Thêm khách khác
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white"
      >
        <UserPlus className="h-4 w-4" /> Thêm khách hàng
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <p className="font-semibold text-gray-900">Khách hàng mới</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tên *">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
        </Field>
        <Field label="Số điện thoại *">
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            inputMode="numeric"
            placeholder="09xxxxxxxx"
            className={input}
          />
        </Field>
        <Field label="Mật khẩu (trống = 123456)">
          <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={input} />
        </Field>
        <Field label="Khu vực">
          <select value={form.zoneId} onChange={(e) => setForm({ ...form, zoneId: e.target.value })} className={input}>
            <option value="">— Chọn —</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Địa chỉ" full>
          <input
            value={form.line}
            onChange={(e) => setForm({ ...form, line: e.target.value })}
            placeholder="Số nhà, đường, phường"
            className={input}
          />
        </Field>
        <Field label="Quận/Huyện">
          <input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className={input} />
        </Field>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={submit}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Đang tạo…" : "Tạo khách"}
        </button>
        <button onClick={() => setOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-600">
          Đóng
        </button>
      </div>
    </div>
  );
}

const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand";

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={full ? "col-span-2 block" : "block"}>
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  );
}
