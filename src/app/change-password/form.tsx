"use client";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "../(app)/admin/actions";

export function FirstPasswordForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof changePassword>>, fd: FormData) => {
    const r = await changePassword(prev, fd);
    if (r?.ok) { toast.success(r.ok); router.replace("/"); router.refresh(); }
    return r;
  }, undefined);
  return (
    <form action={action} className="space-y-3">
      {state?.error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{state.error}</div>}
      <div className="space-y-1.5"><Label htmlFor="current">Mật khẩu hiện tại (do hệ thống cấp)</Label><Input id="current" type="password" name="current" required autoComplete="current-password" className="h-12" /></div>
      <div className="space-y-1.5"><Label htmlFor="next">Mật khẩu mới</Label><Input id="next" type="password" name="next" required minLength={8} autoComplete="new-password" className="h-12" /></div>
      <div className="space-y-1.5"><Label htmlFor="confirm">Nhập lại mật khẩu mới</Label><Input id="confirm" type="password" name="confirm" required minLength={8} autoComplete="new-password" className="h-12" /></div>
      <Button size="xl" className="w-full" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Lưu và vào hệ thống</Button>
    </form>
  );
}
