"use client";
import { useRef } from "react";
import { Camera, ImagePlus, Loader2, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import { STORAGE_BUCKET } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { PhotoDraft } from "./types";

type Props = {
  photos: PhotoDraft[];
  onChange: (updater: (prev: PhotoDraft[]) => PhotoDraft[]) => void;
  storagePrefix: string | null; // `${storeCode}/${inspectionId}/${itemKey}`
  phase?: PhotoDraft["phase"];
  highlight?: boolean;
  label?: string;
};

export function PhotoField({ photos, onChange, storagePrefix, phase = "normal", highlight, label }: Props) {
  const camRef = useRef<HTMLInputElement>(null);
  const libRef = useRef<HTMLInputElement>(null);
  const list = photos.filter((p) => p.phase === phase);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    if (!storagePrefix) { toast.error("Chọn cửa hàng trước khi chụp ảnh"); return; }
    const supabase = createClient();
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      onChange((prev) => [...prev, { id, preview, caption: "", phase, taken_at: new Date().toISOString(), status: "uploading" }]);
      try {
        const blob = await compressImage(file);
        const path = `${storagePrefix}/${phase}-${id}.jpg`;
        const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (error) throw error;
        onChange((prev) => prev.map((p) => (p.id === id ? { ...p, path, status: "done" } : p)));
      } catch (e) {
        onChange((prev) => prev.map((p) => (p.id === id ? { ...p, status: "error" } : p)));
        toast.error("Tải ảnh thất bại: " + (e instanceof Error ? e.message : ""));
      }
    }
  }

  async function remove(p: PhotoDraft) {
    onChange((prev) => prev.filter((x) => x.id !== p.id));
    if (p.path) await createClient().storage.from(STORAGE_BUCKET).remove([p.path]);
  }

  return (
    <div className="space-y-2">
      {label && <div className="text-xs font-bold uppercase text-muted-foreground">{label}</div>}
      <div className="flex gap-2">
        <button type="button" onClick={() => camRef.current?.click()} className={cn("flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm font-bold transition-colors", highlight ? "border-red-300 bg-red-50 text-red-700" : "border-zinc-300 bg-zinc-50 text-zinc-700 active:bg-zinc-100")}>
          <Camera className="size-5" /> Chụp ảnh
        </button>
        <button type="button" onClick={() => libRef.current?.click()} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-sm font-bold text-zinc-700 active:bg-zinc-100">
          <ImagePlus className="size-5" /> Thư viện
        </button>
        <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
        <input ref={libRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
      </div>
      {list.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {list.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl border bg-white">
              <div className="relative aspect-[4/3] bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.preview} alt="" className="size-full object-cover" />
                {p.status === "uploading" && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><Loader2 className="size-6 animate-spin text-white" /></div>}
                {p.status === "error" && <div className="absolute inset-0 flex items-center justify-center bg-red-600/60 text-xs font-bold text-white"><AlertTriangle className="mr-1 size-4" /> Lỗi tải</div>}
                <button type="button" onClick={() => remove(p)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white" aria-label="Xóa ảnh"><X className="size-4" /></button>
              </div>
              <input
                value={p.caption}
                onChange={(e) => { const v = e.target.value; onChange((prev) => prev.map((x) => (x.id === p.id ? { ...x, caption: v } : x))); }}
                placeholder="Mô tả ảnh..."
                className="w-full border-t px-2 py-1.5 text-xs outline-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
