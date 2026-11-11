"use client";
import { useActionState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "../admin/actions";

export function PasswordForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof changePassword>>, fd: FormData) => {
    const r = await changePassword(prev, fd);
    if (r?.ok) { toast.success(r.ok); ref.current?.reset(); }
    if (r?.error) toast.error(r.error);
    return r;
  }, undefined);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <div className="space-y-1.5"><Label>Mật khẩu hiện tại</Label><Input type="password" name="current" required autoComplete="current-password" /></div>
      <div className="space-y-1.5"><Label>Mật khẩu mới (≥ 8 ký tự)</Label><Input type="password" name="next" required minLength={8} autoComplete="new-password" /></div>
      <div className="space-y-1.5"><Label>Nhập lại mật khẩu mới</Label><Input type="password" name="confirm" required minLength={8} autoComplete="new-password" /></div>
      <Button className="w-full" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Đổi mật khẩu</Button>
    </form>
  );
}
