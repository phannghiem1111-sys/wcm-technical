"use client";
import { useActionState, useState, useTransition } from "react";
import { KeyRound, Loader2, Lock, Pencil, Unlock, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ROLE_LABEL, ROLE_ORDER, type AppRole } from "@/lib/constants";
import { resetPassword, saveUser, setUserStatus } from "../actions";

export type UserRow = { id: string; msnv: string; full_name: string; title: string | null; role: AppRole; region_id: number | null; province: string | null; phone: string | null; status: string; lead_msnv?: string | null };

export function UserDialog({ regions, user }: { regions: { id: number; name: string }[]; user?: UserRow }) {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof saveUser>>, fd: FormData) => {
    const r = await saveUser(prev, fd);
    if (r?.ok) { toast.success("Đã lưu"); if (!user) setCreated(r.ok); else setOpen(false); }
    if (r?.error) toast.error(r.error);
    return r;
  }, undefined);
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setCreated(null); }}>
      <DialogTrigger asChild>{user ? <Button size="icon" variant="ghost" aria-label="Sửa"><Pencil /></Button> : <Button><UserPlus /> Tạo tài khoản</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{user ? `Sửa tài khoản ${user.msnv}` : "Tạo tài khoản nhân viên"}</DialogTitle></DialogHeader>
        {created ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{created}</div>
            <p className="text-xs text-muted-foreground">Gửi mật khẩu cho nhân viên và yêu cầu đổi mật khẩu sau khi đăng nhập.</p>
            <Button className="w-full" onClick={() => { setOpen(false); setCreated(null); }}>Xong</Button>
          </div>
        ) : (
          <form action={action} className="grid grid-cols-2 gap-3">
            <input type="hidden" name="id" value={user?.id ?? ""} />
            <div className="space-y-1.5"><Label>MSNV</Label><Input name="msnv" defaultValue={user?.msnv} required readOnly={!!user} className="uppercase" /></div>
            <div className="space-y-1.5"><Label>Vai trò</Label>
              <NativeSelect name="role" defaultValue={user?.role ?? "nhan_vien"}>{ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</NativeSelect>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Họ tên</Label><Input name="full_name" defaultValue={user?.full_name} required /></div>
            <div className="space-y-1.5"><Label>Chức danh</Label><Input name="title" defaultValue={user?.title ?? ""} placeholder="NV kỹ thuật Minimart" /></div>
            <div className="space-y-1.5"><Label>Điện thoại</Label><Input name="phone" type="tel" defaultValue={user?.phone ?? ""} /></div>
            <div className="space-y-1.5"><Label>Khu vực</Label>
              <NativeSelect name="region_id" defaultValue={user?.region_id ?? ""}><option value="">—</option>{regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</NativeSelect>
            </div>
            <div className="space-y-1.5"><Label>Tỉnh phụ trách</Label><Input name="province" defaultValue={user?.province ?? ""} /></div>
            <div className="space-y-1.5"><Label>MSNV đội trưởng</Label><Input name="team_lead_msnv" defaultValue={user?.lead_msnv ?? ""} className="uppercase" /></div>
            {!user && <div className="space-y-1.5"><Label>Mật khẩu</Label><Input name="password" placeholder="Bỏ trống để tự sinh" /></div>}
            <Button className="col-span-2" size="lg" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Lưu</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function UserActions({ user }: { user: UserRow }) {
  const [pending, start] = useTransition();
  const [pw, setPw] = useState<string | null>(null);
  return (
    <>
      <Button size="icon" variant="ghost" disabled={pending} aria-label="Cấp lại mật khẩu" onClick={() => { if (confirm(`Cấp lại mật khẩu cho ${user.msnv}?`)) start(async () => { const r = await resetPassword(user.msnv); if (r.error) toast.error(r.error); else setPw(r.password!); }); }}><KeyRound /></Button>
      <Button size="icon" variant="ghost" disabled={pending} aria-label={user.status === "active" ? "Khóa" : "Mở khóa"} className={user.status === "active" ? "text-red-600" : "text-emerald-600"}
        onClick={() => start(async () => { const r = await setUserStatus(user.id, user.status === "active" ? "locked" : "active"); if (r.error) toast.error(r.error); else toast.success(user.status === "active" ? "Đã khóa tài khoản" : "Đã mở khóa"); })}>
        {user.status === "active" ? <Lock /> : <Unlock />}
      </Button>
      <Dialog open={!!pw} onOpenChange={() => setPw(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mật khẩu mới cho {user.msnv}</DialogTitle><DialogDescription>Gửi cho nhân viên và yêu cầu đổi lại sau khi đăng nhập.</DialogDescription></DialogHeader>
          <div className="rounded-xl bg-zinc-100 p-4 text-center font-mono text-2xl font-bold tracking-wider">{pw}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
