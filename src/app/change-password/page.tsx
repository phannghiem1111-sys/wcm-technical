import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { FirstPasswordForm } from "./form";

export const metadata = { title: "Đổi mật khẩu lần đầu" };

export default async function ChangePasswordPage() {
  const p = await requireProfile();
  if (!p.must_change_password) redirect("/");
  return (
    <AuthShell title="Đặt mật khẩu mới">
      <p className="-mt-3 text-sm text-muted-foreground">Xin chào <b>{p.full_name}</b> ({p.msnv}). Đây là lần đăng nhập đầu tiên, hãy đặt mật khẩu của riêng bạn (gồm 6 chữ số). Trình duyệt sẽ ghi nhớ để lần sau tự điền.</p>
      <FirstPasswordForm />
    </AuthShell>
  );
}
