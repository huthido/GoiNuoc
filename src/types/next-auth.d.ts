import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/domain/types";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role; phone: string } & DefaultSession["user"];
  }
  interface User {
    role: Role;
    phone: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    role: Role;
    phone: string;
  }
}
