"use client";
import { useActionState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { firstLogin } from "../login/actions";

export function FirstLoginForm() {
  const [state, action, pending] = useActionState(firstLogin, undefined);
  const msnvRef = useRef<HTMLInputElement>(null);
  return (
    <form action={action} onSubmit={() => { try { localStorage.setItem("wcm_msnv", (msnvRef.current?.value ?? "").trim()); } catch { /* bỏ qua */ } }} className="space-y-3">
      {state?.error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{state.error}</div>}
      <div className="space-y-1.5"><Label htmlFor="msnv">Mã số nhân viên (MSNV)</Label><Input id="msnv" name="msnv" ref={msnvRef} inputMode="numeric" required autoComplete="username" className="h-12" /></div>
      <div className="space-y-1.5"><Label htmlFor="password">Mật khẩu mới (6 chữ số)</Label><Input id="password" type="password" name="password" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="new-password" className="h-12" /></div>
      <div className="space-y-1.5"><Label htmlFor="confirm">Nhập lại mật khẩu</Label><Input id="confirm" type="password" name="confirm" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="new-password" className="h-12" /></div>
      <Button size="xl" className="w-full" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Lưu và vào hệ thống</Button>
    </form>
  );
}
