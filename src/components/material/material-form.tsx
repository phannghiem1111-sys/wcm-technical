"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Search, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { SignaturePad, type SignatureHandle } from "@/components/signature-pad";
import { PhotoField } from "@/components/inspection/photo-field";
import { StorePicker } from "@/components/inspection/store-picker";
import type { PhotoDraft, StoreLite } from "@/components/inspection/types";
import { STORAGE_BUCKET } from "@/lib/constants";
import { MR_CATEGORIES, MR_PROPOSALS, MR_TEMPLATES, mrSubject } from "@/lib/material/constants";
import { cn } from "@/lib/utils";

type Row = { key: string; code: string; name: string; unit: string; qty: string };
type Material = { code: string; name: string; unit: string | null };

export type MaterialInitial = {
  id: string; store: StoreLite; report_at: string; category: string; category_other: string | null; ticket_code: string | null;
  store_manager_name: string | null; email_to: string | null; incident: string; solution: string; proposal: string;
  items: { material_code: string | null; material_name: string; unit: string | null; qty: number }[];
  photos: { path: string; url?: string; phase: "before" | "after" }[];
  hasSignature: boolean;
};

const newRow = (): Row => ({ key: crypto.randomUUID(), code: "", name: "", unit: "", qty: "" });
const localInput = (iso?: string) => { const d = iso ? new Date(iso) : new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

export function MaterialForm({ reporter, initial, initialStore }: { reporter: { full_name: string; msnv: string; title: string | null }; initial?: MaterialInitial; initialStore?: StoreLite | null }) {
  const router = useRouter();
  const [id] = useState(() => initial?.id ?? crypto.randomUUID());
  const [store, setStore] = useState<StoreLite | null>(initial?.store ?? initialStore ?? null);
  const [at, setAt] = useState(localInput(initial?.report_at));
  const [cht, setCht] = useState(initial?.store_manager_name ?? initialStore?.manager_name ?? "");
  const [mail, setMail] = useState(initial?.email_to ?? "");
  const [ticket, setTicket] = useState(initial?.ticket_code ?? "");
  const [cat, setCat] = useState(initial?.category ?? "");
  const [catOther, setCatOther] = useState(initial?.category_other ?? "");
  const [incident, setIncident] = useState(initial?.incident ?? "");
  const [solution, setSolution] = useState(initial?.solution ?? "");
  const [proposal, setProposal] = useState(initial?.proposal ?? "Xuất kho");
  const [rows, setRows] = useState<Row[]>(() => initial?.items.length
    ? initial.items.map((x) => ({ key: crypto.randomUUID(), code: x.material_code ?? "", name: x.material_name, unit: x.unit ?? "", qty: String(x.qty) }))
    : [newRow()]);
  const [photos, setPhotos] = useState<PhotoDraft[]>(() => (initial?.photos ?? []).map((p) => ({ id: crypto.randomUUID(), path: p.path, preview: p.url ?? "", caption: "", phase: p.phase, taken_at: "", status: "done" })));
  const [saving, setSaving] = useState(false);
  const sigReporter = useRef<SignatureHandle>(null);
  const sigStore = useRef<SignatureHandle>(null);

  function pickStore(s: StoreLite | null) {
    setStore(s);
    if (s) { if (!cht) setCht(s.manager_name ?? ""); }
  }

  const addTpl = (cur: string, set: (v: string) => void, t: string) => set(cur.trim() ? cur.replace(/\s+$/, "") + "\n" + t : t);
  const tplList = (k: "incident" | "solution") => [...(MR_TEMPLATES[k][cat] ?? []), ...MR_TEMPLATES[k]["*"]];
  const setRow = (key: string, patch: Partial<Row>) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  async function save() {
    if (!store) return toast.error("Chọn cửa hàng");
    if (!cat) return toast.error("Chọn hạng mục");
    if (cat === "Khác" && !catOther.trim()) return toast.error("Nhập hạng mục khác");
    if (!incident.trim()) return toast.error("Nhập nội dung sự việc");
    if (!solution.trim()) return toast.error("Nhập biện pháp xử lý");
    const items = rows.filter((r) => r.name.trim());
    if (!items.length) return toast.error("Thêm ít nhất 1 vật tư thay thế");
    if (items.some((r) => !(Number(r.qty) > 0))) return toast.error("Nhập số lượng cho từng vật tư");
    if (!proposal) return toast.error("Chọn đề xuất xử lý vật tư");
    if (photos.some((p) => p.status === "uploading")) return toast.error("Ảnh đang tải lên, vui lòng đợi");
    if (!photos.some((p) => p.status === "done")) return toast.error("Cần ít nhất 1 ảnh hiện trường");
    if (!initial?.hasSignature && sigReporter.current?.isEmpty()) return toast.error("Người lập cần ký xác nhận");

    setSaving(true);
    try {
      const supabase = createClient();
      const base = `${store.code}/${id}/signatures`;
      const upSig = async (h: SignatureHandle | null, name: string) => {
        const blob = await h?.toBlob();
        if (!blob) return null;
        const path = `${base}/${name}-${Date.now()}.png`;
        const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, blob, { contentType: "image/png", upsert: true });
        if (error) throw error;
        return path;
      };
      const signature_reporter = await upSig(sigReporter.current, "reporter");
      const signature_store = await upSig(sigStore.current, "store");
      const done = photos.filter((p) => p.status === "done" && p.path);
      const { data, error } = await supabase.rpc("save_material_report", {
        payload: {
          id, store_id: store.id, report_at: new Date(at).toISOString(), subject: mrSubject(incident, cat === "Khác" ? catOther : cat),
          category: cat, category_other: cat === "Khác" ? catOther.trim() : "", ticket_code: ticket.trim(), store_manager_name: cht.trim(),
          email_to: mail.trim(), incident: incident.trim(), solution: solution.trim(), proposal,
          photos_before: done.filter((p) => p.phase === "before").map((p) => p.path),
          photos_after: done.filter((p) => p.phase === "after").map((p) => p.path),
          signature_reporter, signature_store,
          items: items.map((r) => ({ material_code: r.code.trim(), material_name: r.name.trim(), unit: r.unit.trim(), qty: Number(r.qty) })),
        },
      });
      if (error) throw error;
      toast.success("Đã lưu biên bản vật tư");
      toast.promise(
        fetch(`/api/material-reports/${data}/email`, { method: "POST" }).then((r) => r.json()).then((r) => { if (!r.ok) throw new Error(r.error); return r; }),
        { loading: "Đang gửi biên bản qua email...", success: (r) => `Đã gửi tới: ${r.to?.join(", ")}`, error: (e) => `Đã lưu, nhưng chưa gửi được mail: ${e instanceof Error ? e.message : "lỗi"}`, duration: 8000 },
      );
      router.replace(`/material-reports/${data}`);
      router.refresh();
    } catch (e) {
      toast.error("Không lưu được: " + (e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e)));
      setSaving(false);
    }
  }

  const prefix = store ? `${store.code}/${id}/vat-tu` : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Thông tin chung</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2"><Label>Cửa hàng *</Label><StorePicker value={store} onChange={pickStore} /></div>
          <div className="space-y-1.5"><Label>Giờ, ngày *</Label><Input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Tên cửa hàng trưởng (CHT)</Label><Input value={cht} onChange={(e) => setCht(e.target.value)} placeholder="Điền tên cửa hàng trưởng" /></div>
          <div className="space-y-1.5"><Label>Mã ticket</Label><Input value={ticket} onChange={(e) => setTicket(e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Hạng mục *</Label>
            <NativeSelect value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">Chọn hạng mục…</option>
              {MR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </NativeSelect>
            {cat === "Khác" && <Input value={catOther} onChange={(e) => setCatOther(e.target.value)} placeholder="Hạng mục khác…" className="mt-2" />}
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Email nhận thêm (không bắt buộc)</Label>
            <Input value={mail} onChange={(e) => setMail(e.target.value)} inputMode="email" placeholder="Nhiều email cách nhau dấu phẩy" />
            <p className="text-xs text-muted-foreground">Biên bản tự gửi về email cửa hàng{store?.email ? ` (${store.email})` : ""} và email này. Không có email nào thì gửi về mail của người lập.</p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3 text-sm md:col-span-2">
            <div><b>Người lập:</b> {reporter.full_name} · {reporter.msnv}{reporter.title ? ` · ${reporter.title}` : ""} · Kỹ thuật</div>
            <div><b>Cửa hàng trưởng:</b> {cht || "(chưa có tên)"} · Cửa hàng</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Nội dung</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <TplField label="1. Nội dung sự việc *" value={incident} onChange={setIncident} tpls={tplList("incident")} onPick={(t) => addTpl(incident, setIncident, t)} />
          <TplField label="2. Biện pháp xử lý / phương án thực hiện *" value={solution} onChange={setSolution} tpls={tplList("solution")} onPick={(t) => addTpl(solution, setSolution, t)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. Vật tư thay thế *</CardTitle>
          <p className="text-xs text-muted-foreground">Gõ tên hoặc mã vật tư, chọn trong gợi ý để tự điền mã và ĐVT. Không có trong danh mục thì nhập tay.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.map((r, i) => (
            <div key={r.key} className="rounded-xl border p-2.5">
              <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span>#{i + 1}{r.code && ` · Mã ${r.code}`}</span>
                <button type="button" onClick={() => setRows((p) => (p.length > 1 ? p.filter((x) => x.key !== r.key) : [newRow()]))} className="rounded p-1 hover:bg-zinc-100" aria-label="Xóa dòng"><X className="size-4" /></button>
              </div>
              <MaterialSearch value={r.name} onText={(v) => setRow(r.key, { name: v, code: "" })} onPick={(m) => setRow(r.key, { name: m.name, code: m.code, unit: m.unit ?? "" })} />
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Input value={r.code} onChange={(e) => setRow(r.key, { code: e.target.value })} placeholder="Mã VT" />
                <Input type="number" inputMode="decimal" step="any" min="0" value={r.qty} onChange={(e) => setRow(r.key, { qty: e.target.value })} placeholder="Số lượng" />
                <Input value={r.unit} onChange={(e) => setRow(r.key, { unit: e.target.value })} placeholder="ĐVT" />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setRows((p) => [...p, newRow()])}><Plus /> Thêm vật tư</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">4. Đề xuất xử lý vật tư *</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-2">
          {MR_PROPOSALS.map((p) => (
            <button key={p} type="button" onClick={() => setProposal(p)} className={cn("h-11 rounded-xl border-2 text-sm font-bold transition-all active:scale-95", proposal === p ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-700")}>{p}</button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ảnh hiện trường *</CardTitle>
          <p className="text-xs text-muted-foreground">Ảnh lưu trên app, không in vào biên bản.</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <PhotoField label="Ảnh trước" phase="before" photos={photos} onChange={setPhotos} storagePrefix={prefix} />
          <PhotoField label="Ảnh sau" phase="after" photos={photos} onChange={setPhotos} storagePrefix={prefix} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ký xác nhận</CardTitle>{initial?.hasSignature && <p className="text-xs text-muted-foreground">Đã có chữ ký. Ký lại nếu muốn thay.</p>}</CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <SignaturePad ref={sigReporter} label={`Người lập: ${reporter.full_name}`} />
          <SignaturePad ref={sigStore} label={`Cửa hàng trưởng${cht ? `: ${cht}` : ""}`} />
        </CardContent>
      </Card>

      <div className="sticky bottom-20 z-10 lg:bottom-4">
        <Button size="lg" className="w-full shadow-lg" disabled={saving} onClick={save}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />} Lưu & gửi mail
        </Button>
      </div>
    </div>
  );
}

function TplField({ label, value, onChange, tpls, onPick }: { label: string; value: string; onChange: (v: string) => void; tpls: string[]; onPick: (t: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs text-muted-foreground">Chọn mẫu:</span>
        {tpls.map((t) => (
          <button key={t} type="button" onClick={() => onPick(t)} className="rounded-full border bg-zinc-50 px-2.5 py-1 text-left text-xs font-semibold text-zinc-700 active:bg-zinc-200">{t.length > 46 ? t.slice(0, 44) + "…" : t}</button>
        ))}
      </div>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
    </div>
  );
}

/** Ô tìm vật tư trong danh mục (theo mã hoặc tên). */
function MaterialSearch({ value, onText, onPick }: { value: string; onText: (v: string) => void; onPick: (m: Material) => void }) {
  const [res, setRes] = useState<Material[]>([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const term = q.trim().replace(/[%,()]/g, "");
    if (term.length < 2) return;
    const t = setTimeout(async () => {
      const words = term.split(/\s+/).filter(Boolean);
      let query = createClient().from("materials").select("code, name, unit").eq("is_active", true);
      if (words.length === 1) query = query.or(`code.ilike.${words[0]}%,name.ilike.%${words[0]}%`);
      else words.forEach((w) => { query = query.ilike("name", `%${w}%`); });
      const { data } = await query.order("name").limit(20);
      setRes((data as Material[]) ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const show = open && q.trim().length >= 2 && res.length > 0;
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => { onText(e.target.value); setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 200)} placeholder="Tên vật tư (vd: băng keo)…" className="pl-9" />
      {show && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border bg-white shadow-xl">
          {res.map((m) => (
            <button key={m.code} type="button" onClick={() => { onPick(m); setOpen(false); setQ(""); setRes([]); }} className="block w-full border-b px-3 py-2 text-left last:border-0 active:bg-zinc-100">
              <div className="text-sm font-semibold">{m.name}</div>
              <div className="text-xs text-muted-foreground">{m.code}{m.unit ? ` · ${m.unit}` : ""}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
