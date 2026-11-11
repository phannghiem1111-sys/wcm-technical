"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestReset } from "../login/actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestReset, undefined);
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-5 rounded-3xl bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold">Quên mật khẩu</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gửi yêu cầu cấp lại mật khẩu tới Đội trưởng / Quản trị hệ thống.</p>
        </div>
        {state?.error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>}
        {state?.ok ? (
          <div className="rounded-xl bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-800">{state.ok}</div>
        ) : (
          <form action={action} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="msnv">MSNV</Label><Input id="msnv" name="msnv" required className="uppercase" /></div>
            <div className="space-y-2"><Label htmlFor="phone">Số điện thoại liên hệ</Label><Input id="phone" name="phone" type="tel" inputMode="tel" /></div>
            <div className="space-y-2"><Label htmlFor="note">Ghi chú</Label><Textarea id="note" name="note" rows={2} /></div>
            <Button className="w-full" size="lg" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Gửi yêu cầu</Button>
          </form>
        )}
        <Link href="/login" className="block text-center text-sm font-semibold text-primary">← Quay lại đăng nhập</Link>
      </div>
    </main>
  );
}
