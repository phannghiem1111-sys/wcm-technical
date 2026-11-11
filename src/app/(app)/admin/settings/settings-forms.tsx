"use client";
import { useActionState, useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { saveFrequency, saveTemplateItem } from "../actions";

export function FrequencyInput({ sectionId, value }: { sectionId: number; value: number }) {
  const [v, setV] = useState(String(value));
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <Input type="number" min={1} inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} className="w-24" />
      <span className="text-sm text-muted-foreground">ngày</span>
      <Button size="icon" variant="outline" disabled={pending || Number(v) === value} onClick={() => start(async () => { const r = await saveFrequency(sectionId, Number(v)); if (r.error) toast.error(r.error); else toast.success("Đã lưu tần suất"); })}>
        {pending ? <Loader2 className="animate-spin" /> : <Save />}
      </Button>
    </div>
  );
}

export function ItemDialog({ sectionId, item }: { sectionId: number; item?: { id: number; text: string; is_active: boolean } }) {
  const [open, setOpen] = useState(false);
  const [, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof saveTemplateItem>>, fd: FormData) => {
    const r = await saveTemplateItem(prev, fd);
    if (r?.ok) { toast.success(r.ok); setOpen(false); }
    if (r?.error) toast.error(r.error);
    return r;
  }, undefined);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{item ? <Button size="icon" variant="ghost" className="size-8"><Pencil className="size-4" /></Button> : <Button size="sm" variant="outline"><Plus /> Thêm tiêu chí</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{item ? "Sửa tiêu chí" : "Thêm tiêu chí"}</DialogTitle></DialogHeader>
        <form action={action} className="space-y-3">
          <input type="hidden" name="id" value={item?.id ?? ""} />
          <input type="hidden" name="section_id" value={sectionId} />
          <Textarea name="text" defaultValue={item?.text} rows={3} required />
          {item && <NativeSelect name="is_active" defaultValue={item.is_active ? "on" : "off"}><option value="on">Đang sử dụng</option><option value="off">Ẩn khỏi biểu mẫu</option></NativeSelect>}
          <Button className="w-full" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Lưu</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
