"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { saveProduct, toggleProductActive } from "@/server/admin";
import { formatVND } from "@/lib/format";
import { PRODUCT_TYPES, type ProductType } from "@/lib/domain/types";
import { PRODUCT_TYPE_LABELS } from "@/lib/labels";

export interface AdminProduct {
  id: string;
  sku: string;
  name: string;
  type: string;
  unit: string;
  price: number;
  depositPrice: number;
  isReturnable: boolean;
  stock: number;
  isActive: boolean;
}

type FormState = Omit<AdminProduct, "isActive">;

const EMPTY: FormState = {
  id: "",
  sku: "",
  name: "",
  type: "BINH_20L",
  unit: "bình",
  price: 0,
  depositPrice: 0,
  isReturnable: true,
  stock: 0,
};

export function ProductsManager({ products }: { products: AdminProduct[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openNew() {
    setError(null);
    setForm({ ...EMPTY });
  }
  function openEdit(p: AdminProduct) {
    setError(null);
    const { isActive: _omit, ...rest } = p;
    void _omit;
    setForm({ ...rest });
  }

  function submit() {
    if (!form) return;
    setError(null);
    start(async () => {
      const res = await saveProduct({
        id: form.id || undefined,
        sku: form.sku,
        name: form.name,
        type: form.type,
        unit: form.unit,
        price: Number(form.price),
        depositPrice: Number(form.depositPrice),
        isReturnable: form.isReturnable,
        stock: Number(form.stock),
      });
      if (res.ok) {
        setForm(null);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Sản phẩm</h1>
        <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" /> Thêm
        </button>
      </div>

      {form && (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <p className="font-semibold text-gray-900">{form.id ? "Sửa sản phẩm" : "Sản phẩm mới"}</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mã (SKU)">
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={input} />
            </Field>
            <Field label="Loại">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={input}>
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {PRODUCT_TYPE_LABELS[t as ProductType]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tên" full>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
            </Field>
            <Field label="Đơn vị">
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={input} />
            </Field>
            <Field label="Giá (VND)">
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className={input} />
            </Field>
            <Field label="Cọc vỏ (VND)">
              <input type="number" value={form.depositPrice} onChange={(e) => setForm({ ...form, depositPrice: Number(e.target.value) })} className={input} />
            </Field>
            <Field label="Tồn kho">
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className={input} />
            </Field>
            <label className="col-span-2 flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isReturnable} onChange={(e) => setForm({ ...form, isReturnable: e.target.checked })} className="accent-sky-600" />
              Hàng có vỏ tuần hoàn (tính cọc vỏ)
            </label>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex gap-2">
            <button disabled={pending} onClick={submit} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {pending ? "Đang lưu…" : "Lưu"}
            </button>
            <button onClick={() => setForm(null)} className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-600">
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="divide-y">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{p.name}</span>
                  {!p.isActive && <span className="rounded bg-gray-200 px-1.5 text-[11px] text-gray-500">Ẩn</span>}
                </div>
                <p className="text-xs text-gray-400">
                  {p.sku} · {PRODUCT_TYPE_LABELS[p.type as ProductType]} · tồn {p.stock}
                  {p.isReturnable && p.depositPrice > 0 ? ` · cọc ${formatVND(p.depositPrice)}` : ""}
                </p>
              </div>
              <span className="font-semibold text-gray-900">{formatVND(p.price)}</span>
              <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-gray-400 hover:bg-slate-100 hover:text-gray-700" aria-label="Sửa">
                <Pencil className="h-4 w-4" />
              </button>
              <button
                disabled={pending}
                onClick={() => start(async () => { await toggleProductActive(p.id); router.refresh(); })}
                className="rounded-lg border px-2.5 py-1 text-xs font-medium text-gray-600 disabled:opacity-60"
              >
                {p.isActive ? "Ẩn" : "Hiện"}
              </button>
            </div>
          ))}
        </div>
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
