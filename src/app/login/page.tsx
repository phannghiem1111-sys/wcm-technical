import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export const metadata = { title: "Đăng nhập" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; locked?: string }> }) {
  const sp = await searchParams;
  return <AuthShell><LoginForm next={sp.next ?? "/"} locked={sp.locked === "1"} /></AuthShell>;
}

