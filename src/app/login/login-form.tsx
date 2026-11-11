"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, IdCard, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "./actions";

export function LoginForm({ next, locked }: { next: string; locked: boolean }) {
  const [state, action, pending] = useActionState(login, undefined);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {(state?.error || locked) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          {state?.error ?? "Tài khoản đã bị khóa. Liên hệ quản trị."}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="msnv">Mã số nhân viên (MSNV)</Label>
        <div className="relative">
          <IdCard className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input id="msnv" name="msnv" required autoComplete="username" autoCapitalize="characters" placeholder="VD: 123456" className="h-12 pl-10 uppercase" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input id="password" name="password" type={show ? "text" : "password"} required autoComplete="current-password" placeholder="••••••••" className="h-12 px-10" />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Hiện mật khẩu">
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      </div>
      <Button type="submit" size="xl" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Đăng nhập
      </Button>
      <div className="text-center">
        <Link href="/forgot-password" className="text-sm font-semibold text-primary">Quên mật khẩu?</Link>
      </div>
    </form>
  );
}
