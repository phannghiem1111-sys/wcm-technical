"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2, Minus, Plus, RotateCcw, Send, Wrench, X, Eye, AlertOctagon, Ban } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { SignaturePad, type SignatureHandle } from "@/components/signature-pad";
import { BAD_RESULTS, FORM_META, RESULT_OPTIONS, STORAGE_BUCKET, type FormType, type ItemResult } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PhotoField } from "./photo-field";
import { StorePicker } from "./store-picker";
import type { ItemDraft, PhotoDraft, StoreLite, TemplateSection } from "./types";

type Props = {
  formType: FormType;
  sections: TemplateSection[];
  inspector: { full_name: string; msnv: string };
  initialStore: StoreLite | null;
  planId: string | null;
  planName: string | null;
};

type Draft = {
  inspectionId: string;
  store: StoreLite | null;
  date: string;
  overallNote: string;
  storeRep: string;
  items: Record<string, ItemDraft>;
  deviceCounts: Record<string, number>;
};

const emptyItem = (): ItemDraft => ({ note: "", proposal: "", photos: [] });
const today = () => new Date().toLocaleDateString("en-CA");
const MUST_PHOTO: ItemResult[] = ["fail", "urgent", "broken"];

const TONE: Record<string, { on: string; off: string; icon: React.ComponentType<{ className?: string }> }> = {
  success: { on: "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30", off: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: Check },
  danger: { on: "bg-red-600 text-white border-red-600 shadow-md shadow-red-600/30", off: "bg-red-50 text-red-800 border-red-200", icon: X },
  warning: { on: "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30", off: "bg-amber-50 text-amber-800 border-amber-200", icon: Eye },
  urgent: { on: "bg-fuchsia-700 text-white border-fuchsia-700 shadow-md shadow-fuchsia-700/30", off: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200", icon: AlertOctagon },
  muted: { on: "bg-zinc-600 text-white border-zinc-600", off: "bg-zinc-50 text-zinc-600 border-zinc-200", icon: Ban },
};

function ResultButtons({ formType, value, onChange }: { formType: FormType; value?: ItemResult; onChange: (v: ItemResult) => void }) {
  const opts = RESULT_OPTIONS[formType];
  return (
    <div className={cn("grid gap-1.5", opts.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")}>
      {opts.map((o) => {
        const t = TONE[o.tone];
        const Icon = t.icon;
        const on = value === o.value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} className={cn("flex h-11 items-center justify-center gap-1 rounded-xl border-2 px-1 text-[13px] font-bold transition-all active:scale-95", on ? t.on : t.off)}>
            <Icon className="size-4" /> {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function InspectionForm({ formType, sections, inspector, initialStore, planId, planName }: Props) {
  const router = useRouter();
  const meta = FORM_META[formType];
  const draftKey = `wcm-draft-${formType}${planId ? "-" + planId : ""}`;
  const isMaint = formType === "maintenance";

  const freshDraft = (): Draft => ({
    inspectionId: crypto.randomUUID(),
    store: initialStore,
    date: today(),
    overallNote: "",
    storeRep: "",
    items: {},
    deviceCounts: Object.fromEntries(sections.map((s) => [s.code, s.default_count])),
  });

  const [restored] = useState<Draft | null>(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      const draft = raw ? (JSON.parse(raw) as Draft) : null;
      if (draft && (!initialStore || draft.store?.id === initialStore.id)) {
        // ảnh chưa upload xong khi rời trang thì bỏ
        return { ...draft, items: Object.fromEntries(Object.entries(draft.items).map(([k, v]) => [k, { ...v, photos: v.photos.filter((p) => p.path) }])) };
      }
    } catch { /* ignore */ }
    return null;
  });
  const [d, setD] = useState<Draft>(() => restored ?? freshDraft());
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const sigInspector = useRef<SignatureHandle>(null);
  const sigStore = useRef<SignatureHandle>(null);

  // Khôi phục nháp: tạo lại link xem ảnh đã upload
  useEffect(() => {
    if (!restored) return;
    toast.info("Đã khôi phục phiếu nháp chưa nộp");
    const paths = Object.values(restored.items).flatMap((i) => i.photos.map((p) => p.path!));
    if (!paths.length) return;
    createClient().storage.from(STORAGE_BUCKET).createSignedUrls(paths, 3600).then(({ data }) => {
      if (!data) return;
      const map = new Map(data.map((x) => [x.path, x.signedUrl]));
      setD((prev) => ({ ...prev, items: Object.fromEntries(Object.entries(prev.items).map(([k, v]) => [k, { ...v, photos: v.photos.map((p) => ({ ...p, preview: (p.path && map.get(p.path)) || p.preview, status: p.path ? ("done" as const) : p.status })) }])) }));
    });
  }, [restored]);

  // Lưu nháp
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify(d)); } catch { /* quota */ }
    }, 400);
    return () => clearTimeout(t);
  }, [d, draftKey]);

  // Danh sách mục cần đánh giá
  const rendered = useMemo(() => {
    if (!isMaint) return sections.map((s) => ({ section: s, rows: s.items.map((it) => ({ key: it.code, text: it.text })) }));
    return sections
      .filter((s) => (d.deviceCounts[s.code] ?? 0) > 0)
      .map((s) => ({
        section: s,
        rows: Array.from({ length: d.deviceCounts[s.code] }, (_, i) => ({ key: `${s.code.toLowerCase()}_${i + 1}`, text: `${s.equipment_label ?? "Thiết bị"} số ${i + 1}` })),
      }));
  }, [d, sections, isMaint]);

  const allKeys = rendered.flatMap((r) => r.rows.map((x) => x.key));
  const answered = allKeys.filter((k) => d.items[k]?.result).length;
  const pct = allKeys.length ? Math.round((answered / allKeys.length) * 100) : 0;

  const setItem = (key: string, patch: Partial<ItemDraft>) =>
    setD((prev) => ({ ...prev, items: { ...prev.items, [key]: { ...emptyItem(), ...prev.items[key], ...patch } } }));
  const setPhotos = (key: string) => (updater: (p: PhotoDraft[]) => PhotoDraft[]) =>
    setD((prev) => ({ ...prev, items: { ...prev.items, [key]: { ...emptyItem(), ...prev.items[key], photos: updater(prev.items[key]?.photos ?? []) } } }));
  const prefix = (key: string) => (d.store ? `${d.store.code}/${d.inspectionId}/${key}` : null);

  function reset() {
    if (!confirm("Xóa toàn bộ dữ liệu phiếu đang nhập?")) return;
    localStorage.removeItem(draftKey);
    setD(freshDraft());
    sigInspector.current?.clear();
    sigStore.current?.clear();
  }

  async function submit() {
    if (!d.store) return toast.error("Vui lòng chọn cửa hàng");
    if (!allKeys.length) return toast.error("Chưa có hạng mục nào để đánh giá");
    const missing = allKeys.filter((k) => !d.items[k]?.result);
    if (missing.length) return toast.error(`Còn ${missing.length} mục chưa đánh giá`);
    const needPhoto = allKeys.filter((k) => {
      const it = d.items[k];
      return it?.result && MUST_PHOTO.includes(it.result) && !it.photos.some((p) => p.status === "done");
    });
    if (needPhoto.length) return toast.error(`${needPhoto.length} mục lỗi/hư hỏng chưa có ảnh minh chứng`);
    if (Object.values(d.items).some((i) => i.photos.some((p) => p.status === "uploading"))) return toast.error("Ảnh đang tải lên, vui lòng đợi");
    if (sigInspector.current?.isEmpty()) return toast.error("Nhân viên thực hiện cần ký xác nhận");

    setSubmitting(true);
    try {
      const supabase = createClient();
      const base = `${d.store.code}/${d.inspectionId}/signatures`;
      const upSig = async (h: SignatureHandle | null, name: string) => {
        const blob = await h?.toBlob();
        if (!blob) return null;
        const path = `${base}/${name}.png`;
        const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, blob, { contentType: "image/png", upsert: true });
        if (error) throw error;
        return path;
      };
      const signature_inspector = await upSig(sigInspector.current, "inspector");
      const signature_store = await upSig(sigStore.current, "store");

      let sort = 0;
      const items = rendered.flatMap(({ section, rows }) =>
        rows.map((r) => {
          const it = d.items[r.key] ?? emptyItem();
          const work = [...(it.tasks ?? []), it.work_extra?.trim()].filter(Boolean).join("\n");
          return {
            item_key: r.key,
            section_title: section.title,
            item_text: r.text,
            result: it.result,
            note: it.note || null,
            proposal: it.proposal || null,
            ...(isMaint && {
              equipment_name: r.text,
              model: it.model || null,
              before_status: it.before_status ?? null,
              work_done: work || null,
              materials: it.materials || null,
              after_status: it.result,
              completion: it.completion ?? null,
            }),
            sort: sort++,
          };
        }),
      );
      const photos = allKeys.flatMap((k) => {
        const it = d.items[k];
        if (!it) return [];
        const row = rendered.flatMap((r) => r.rows).find((r) => r.key === k);
        return it.photos.filter((p) => p.status === "done" && p.path).map((p) => ({
          item_key: k,
          path: p.path,
          caption: p.caption || null,
          phase: p.phase,
          taken_at: p.taken_at,
          defect: it.result && BAD_RESULTS.includes(it.result) ? [row?.text, it.note].filter(Boolean).join(" – ") : null,
        }));
      });

      const { data, error } = await supabase.rpc("submit_inspection", {
        payload: {
          id: d.inspectionId,
          form_type: formType,
          store_id: d.store.id,
          inspection_date: d.date,
          plan_id: planId,
          overall_note: d.overallNote || null,
          device_config: isMaint ? d.deviceCounts : null,
          store_rep_name: d.storeRep || null,
          signature_inspector,
          signature_store,
          items,
          photos,
        },
      });
      if (error) throw error;
      localStorage.removeItem(draftKey);
      toast.success("Đã lưu biên bản thành công");
      router.replace(`/inspections/${data}`);
      router.refresh();
    } catch (e) {
      toast.error("Không lưu được biên bản: " + (e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e)));
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Thông tin cơ sở */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Thông tin cơ sở</CardTitle>
          <span className={cn("rounded-md px-2.5 py-1 text-xs font-bold uppercase text-white", meta.color)}>{meta.badge}</span>
        </CardHeader>
        <CardContent className="space-y-4">
          {planName && <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">Theo kế hoạch: {planName}</div>}
          <div className="space-y-2">
            <Label>Cửa hàng</Label>
            <StorePicker value={d.store} onChange={(s) => setD({ ...d, store: s })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">Ngày thực hiện</Label>
              <Input id="date" type="date" value={d.date} max={today()} onChange={(e) => setD({ ...d, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Nhân viên thực hiện</Label>
              <div className="flex h-11 items-center truncate rounded-xl border bg-muted px-3 text-sm font-semibold">{inspector.msnv} – {inspector.full_name}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cấu hình thiết bị bảo trì */}
      {isMaint && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Wrench className="size-5 text-amber-600" /> Số lượng thiết bị thực tế tại cửa hàng</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {sections.map((s) => (
              <div key={s.code} className="flex items-center justify-between rounded-xl border bg-white px-3 py-2">
                <span className="text-sm font-semibold">{s.equipment_label ?? s.title}</span>
                <div className="flex items-center gap-2">
                  <Button type="button" size="icon" variant="outline" className="size-9" onClick={() => setD({ ...d, deviceCounts: { ...d.deviceCounts, [s.code]: Math.max(0, (d.deviceCounts[s.code] ?? 0) - 1) } })}><Minus /></Button>
                  <span className="w-6 text-center text-lg font-black">{d.deviceCounts[s.code] ?? 0}</span>
                  <Button type="button" size="icon" variant="outline" className="size-9" onClick={() => setD({ ...d, deviceCounts: { ...d.deviceCounts, [s.code]: Math.min(30, (d.deviceCounts[s.code] ?? 0) + 1) } })}><Plus /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tiến độ */}
      <div className="sticky top-[calc(env(safe-area-inset-top)+60px)] z-20 rounded-2xl border bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:top-2">
        <div className="mb-1.5 flex justify-between text-sm font-bold">
          <span>Tiến độ đánh giá</span>
          <span className={pct === 100 ? "text-emerald-600" : "text-primary"}>{answered}/{allKeys.length}</span>
        </div>
        <Progress value={pct} indicatorClassName={pct === 100 ? "bg-emerald-500" : undefined} />
      </div>

      {/* Checklist */}
      {rendered.map(({ section, rows }, si) => {
        const done = rows.filter((r) => d.items[r.key]?.result).length;
        const collapsed = open[section.code] === false;
        return (
          <Card key={section.code} className="overflow-hidden">
            <button type="button" onClick={() => setOpen({ ...open, [section.code]: collapsed })} className={cn("flex w-full items-center gap-3 px-4 py-3.5 text-left", isMaint ? "bg-amber-50" : "bg-zinc-100")}>
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-black text-white", isMaint ? "bg-amber-600" : "bg-zinc-900")}>{si + 1}</span>
              <span className="flex-1 text-[13px] font-extrabold uppercase tracking-wide">{section.title}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", done === rows.length ? "bg-emerald-100 text-emerald-700" : "bg-white text-zinc-600")}>{done}/{rows.length}</span>
              <ChevronDown className={cn("size-5 transition-transform", collapsed && "-rotate-90")} />
            </button>
            {!collapsed && (
              <div className="divide-y">
                {rows.map((r, ri) => {
                  const it = d.items[r.key] ?? emptyItem();
                  const bad = it.result && BAD_RESULTS.includes(it.result);
                  return (
                    <div key={r.key} className={cn("space-y-3 p-4", bad && "bg-red-50/40")}>
                      <div className="flex gap-2.5">
                        <span className="mt-0.5 text-sm font-bold text-zinc-400">{si + 1}.{ri + 1}</span>
                        <p className={cn("text-[15px] leading-snug", isMaint ? "font-bold" : "font-semibold text-zinc-800")}>{r.text}</p>
                      </div>

                      {isMaint ? (
                        <MaintenanceRow section={section} item={it} onChange={(p) => setItem(r.key, p)} formType={formType} photosProps={{ onChange: setPhotos(r.key), storagePrefix: prefix(r.key) }} />
                      ) : (
                        <>
                          <ResultButtons formType={formType} value={it.result} onChange={(v) => setItem(r.key, { result: v })} />
                          <Input value={it.note} onChange={(e) => setItem(r.key, { note: e.target.value })} placeholder={bad ? "Mô tả lỗi / hiện trạng..." : "Ghi chú (nếu có)"} className={cn(bad && "border-red-300")} />
                          {bad && <Input value={it.proposal} onChange={(e) => setItem(r.key, { proposal: e.target.value })} placeholder="Đề xuất xử lý..." className="border-red-300" />}
                          <PhotoField photos={it.photos} onChange={setPhotos(r.key)} storagePrefix={prefix(r.key)} highlight={bad} />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}

      {isMaint && rendered.length === 0 && (
        <Card><CardContent className="py-10 text-center text-sm font-semibold text-muted-foreground">Nhập số lượng thiết bị ở trên để tạo bảng bảo trì.</CardContent></Card>
      )}

      {/* Tổng kết & ký */}
      <Card>
        <CardHeader><CardTitle className="text-base">Đánh giá tổng thể & ký xác nhận</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Textarea value={d.overallNote} onChange={(e) => setD({ ...d, overallNote: e.target.value })} placeholder="Nhận xét chung, kiến nghị..." rows={3} />
          <div className="grid gap-4 md:grid-cols-2">
            <SignaturePad ref={sigInspector} label={`NV thực hiện: ${inspector.full_name}`} />
            <div className="space-y-2">
              <Input value={d.storeRep} onChange={(e) => setD({ ...d, storeRep: e.target.value })} placeholder="Họ tên đại diện cửa hàng (CHT)" />
              <SignaturePad ref={sigStore} label="Đại diện cửa hàng ký xác nhận" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+76px)] z-20 flex gap-2 lg:bottom-4">
        <Button type="button" variant="outline" size="xl" className="bg-white px-4 shadow-md" onClick={reset} disabled={submitting} aria-label="Làm lại"><RotateCcw /><span className="hidden sm:inline">Làm lại</span></Button>
        <Button type="button" size="xl" className="min-w-0 flex-1 shadow-lg shadow-red-900/20" onClick={submit} disabled={submitting}>
          {submitting ? <Loader2 className="animate-spin" /> : <Send />} <span className="truncate">Lưu & hoàn tất<span className="hidden sm:inline"> biên bản</span></span>
        </Button>
      </div>
    </div>
  );
}

function MaintenanceRow({ section, item, onChange, formType, photosProps }: {
  section: TemplateSection;
  item: ItemDraft;
  onChange: (p: Partial<ItemDraft>) => void;
  formType: FormType;
  photosProps: { onChange: (u: (p: PhotoDraft[]) => PhotoDraft[]) => void; storagePrefix: string | null };
}) {
  const tasks = item.tasks ?? [];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Input value={item.model ?? ""} onChange={(e) => onChange({ model: e.target.value })} placeholder="Model / Mã thiết bị" />
        <Input value={item.materials ?? ""} onChange={(e) => onChange({ materials: e.target.value })} placeholder="Vật tư thay thế" />
      </div>
      <div>
        <div className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Tình trạng trước bảo trì</div>
        <ResultButtons formType={formType} value={item.before_status} onChange={(v) => onChange({ before_status: v })} />
      </div>
      <div>
        <div className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Công việc đã thực hiện</div>
        <div className="space-y-1.5">
          {section.items.map((t) => {
            const on = tasks.includes(t.text);
            return (
              <button key={t.code} type="button" onClick={() => onChange({ tasks: on ? tasks.filter((x) => x !== t.text) : [...tasks, t.text] })} className={cn("flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm", on ? "border-emerald-300 bg-emerald-50 font-semibold" : "bg-white")}>
                <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2", on ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-300")}>{on && <Check className="size-3.5" />}</span>
                {t.text}
              </button>
            );
          })}
          <Input value={item.work_extra ?? ""} onChange={(e) => onChange({ work_extra: e.target.value })} placeholder="Công việc khác..." />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <PhotoField photos={item.photos} {...photosProps} phase="before" label="Ảnh trước bảo trì" />
        <PhotoField photos={item.photos} {...photosProps} phase="after" label="Ảnh sau bảo trì" />
      </div>
      <div>
        <div className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Tình trạng sau bảo trì</div>
        <ResultButtons formType={formType} value={item.result} onChange={(v) => onChange({ result: v })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NativeSelect value={item.completion ?? ""} onChange={(e) => onChange({ completion: (e.target.value || undefined) as ItemDraft["completion"] })}>
          <option value="">Đánh giá hoàn thành</option>
          <option value="done">Hoàn thành</option>
          <option value="partial">Hoàn thành một phần</option>
          <option value="not_done">Chưa hoàn thành</option>
        </NativeSelect>
        <Input value={item.note} onChange={(e) => onChange({ note: e.target.value })} placeholder="Ghi chú kỹ thuật" />
      </div>
    </div>
  );
}
