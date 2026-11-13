"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { rejectResetRequest, resetPassword } from "../actions";

export function RequestActions({ id, msnv }: { id: number; msnv: string }) {
  const [pending, start] = useTransition();
  const [pw, setPw] = useState<string | null>(null);
  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => start(async () => { const r = await resetPassword(msnv, id); if (r.error) toast.error(r.error); else { setPw(r.password!); toast[r.emailed ? "success" : "message"](r.emailed ? `Đã gửi mật khẩu về ${r.emailed}` : "Chưa gửi được mail, hãy gửi mật khẩu cho nhân viên"); } })}>Cấp MK mới</Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => start(() => rejectResetRequest(id))}>Từ chối</Button>
      <Dialog open={!!pw} onOpenChange={() => setPw(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mật khẩu mới cho {msnv}</DialogTitle><DialogDescription>Liên hệ nhân viên để gửi mật khẩu.</DialogDescription></DialogHeader>
          <div className="rounded-xl bg-zinc-100 p-4 text-center font-mono text-2xl font-bold tracking-wider">{pw}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
