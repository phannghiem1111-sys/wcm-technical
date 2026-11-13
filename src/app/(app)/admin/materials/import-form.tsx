"use client";
import { useActionState, useEffect, useTransition } from "react";
import { Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { deleteMaterial, importMaterials, syncMaterialsFromSheet } from "./actions";

export function ImportForm() {
  const [state, action, pending] = useActionState(importMaterials, undefined);
  useEffect(() => { if (state?.ok) toast.success(state.ok); if (state?.error) toast.error(state.error); }, [state]);
  return (
    <form action={action} className="space-y-2">
      <Textarea name="data" rows={8} placeholder={"Dán từ Excel 3 cột: Mã vật tư | Tên vật tư | ĐVT\nVD:\nVT0001\tBăng keo điện\tCuộn"} className="font-mono text-xs" />
      <Button type="submit" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Upload />} Nhập danh mục</Button>
    </form>
  );
}

const KEY = "wcm_materials_sheet";

export function SheetSync({ defaultUrl }: { defaultUrl: string }) {
  const [state, action, pending] = useActionState(syncMaterialsFromSheet, undefined);
  useEffect(() => { if (state?.ok) toast.success(state.ok); if (state?.error) toast.error(state.error); }, [state]);
  const saved = (() => { try { return typeof window !== "undefined" ? localStorage.getItem(KEY) ?? "" : ""; } catch { return ""; } })();
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row">
      <Input name="url" defaultValue={saved || defaultUrl} placeholder="Dán link Google Sheet danh mục vật tư" className="flex-1"
        onChange={(e) => { try { localStorage.setItem(KEY, e.target.value); } catch { /* bỏ qua */ } }} />
      <Button type="submit" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <RefreshCw />} Đồng bộ</Button>
    </form>
  );
}

export function DeleteMaterial({ code }: { code: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(async () => { const r = await deleteMaterial(code); if (r.error) toast.error(r.error); })} className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600" aria-label="Xóa">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  );
}
