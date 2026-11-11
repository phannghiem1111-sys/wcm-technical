"use client";
import { useActionState, useState } from "react";
import { Loader2, Pencil, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { importStores, saveStore } from "./actions";

export type StoreRow = { id: string; code: string; name: string; address: string | null; province: string | null; region_id: number | null; open_date: string | null; is_active: boolean; lead_msnv?: string | null; staff_msnv?: string | null };

export function StoreDialog({ regions, store }: { regions: { id: number; name: string }[]; store?: StoreRow }) {
  const [open, setOpen] = useState(false);
  const [, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof saveStore>>, fd: FormData) => {
    const r = await saveStore(prev, fd);
    if (r?.ok) { toast.success(r.ok); setOpen(false); }
    if (r?.error) toast.error(r.error);
    return r;
  }, undefined);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {store ? <Button size="icon" variant="ghost" aria-label="Sửa"><Pencil /></Button> : <Button><Plus /> Thêm cửa hàng</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{store ? `Sửa cửa hàng ${store.code}` : "Thêm cửa hàng"}</DialogTitle></DialogHeader>
        <form action={action} className="grid grid-cols-2 gap-3">
          <input type="hidden" name="id" value={store?.id ?? ""} />
          <div className="space-y-1.5"><Label>Mã CH</Label><Input name="code" defaultValue={store?.code} required className="uppercase" /></div>
          <div className="space-y-1.5"><Label>Ngày khai trương</Label><Input type="date" name="open_date" defaultValue={store?.open_date ?? ""} /></div>
          <div className="col-span-2 space-y-1.5"><Label>Tên cửa hàng</Label><Input name="name" defaultValue={store?.name} required /></div>
          <div className="col-span-2 space-y-1.5"><Label>Địa chỉ</Label><Input name="address" defaultValue={store?.address ?? ""} /></div>
          <div className="space-y-1.5"><Label>Tỉnh</Label><Input name="province" defaultValue={store?.province ?? ""} /></div>
          <div className="space-y-1.5"><Label>Khu vực</Label>
            <NativeSelect name="region_id" defaultValue={store?.region_id ?? ""}><option value="">—</option>{regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</NativeSelect>
          </div>
          <div className="space-y-1.5"><Label>MSNV đội trưởng</Label><Input name="team_lead_msnv" defaultValue={store?.lead_msnv ?? ""} className="uppercase" /></div>
          <div className="space-y-1.5"><Label>MSNV nhân viên</Label><Input name="staff_msnv" defaultValue={store?.staff_msnv ?? ""} className="uppercase" /></div>
          <div className="col-span-2 space-y-1.5"><Label>Trạng thái</Label>
            <NativeSelect name="is_active" defaultValue={store?.is_active === false ? "off" : "on"}><option value="on">Đang hoạt động</option><option value="off">Ngưng hoạt động</option></NativeSelect>
          </div>
          <Button className="col-span-2" size="lg" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Lưu</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof importStores>>, fd: FormData) => {
    const r = await importStores(prev, fd);
    if (r?.ok) { toast.success(r.ok); setOpen(false); }
    if (r?.error) toast.error(r.error);
    return r;
  }, undefined);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline"><Upload /> Import Excel</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import danh mục cửa hàng</DialogTitle>
          <DialogDescription>File .xlsx/.csv, dòng đầu là tiêu đề cột: <code>code, name, address, province, region_code, team_lead_msnv, staff_msnv, open_date</code>. Trùng mã sẽ được cập nhật.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-3">
          <Input type="file" name="file" accept=".xlsx,.xls,.csv" required />
          <a href="/templates/mau-cua-hang.csv" download className="block text-sm font-semibold text-primary">Tải file mẫu</a>
          <Button className="w-full" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Nhập dữ liệu</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
