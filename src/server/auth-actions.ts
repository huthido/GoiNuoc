"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!phone || !password) return { error: "Vui lòng nhập số điện thoại và mật khẩu." };

  try {
    await signIn("credentials", { phone, password, redirectTo: "/" });
    return {};
  } catch (error) {
    if (error instanceof AuthError) return { error: "Sai số điện thoại hoặc mật khẩu." };
    throw error; // gồm cả NEXT_REDIRECT khi đăng nhập thành công
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
