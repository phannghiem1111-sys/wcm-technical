import Link from "next/link";
import { FirstLoginForm } from "./form";

export default function FirstLoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-4 py-8">
      <div>
        <h1 className="text-2xl font-extrabold">Đăng nhập lần đầu</h1>
        <p className="mt-1 text-sm text-muted-foreground">Nhập MSNV và tự đặt mật khẩu. Các lần sau đăng nhập bằng mật khẩu này.</p>
      </div>
      <FirstLoginForm />
      <Link href="/login" className="text-center text-sm font-semibold text-primary">Quay lại đăng nhập</Link>
    </main>
  );
}
