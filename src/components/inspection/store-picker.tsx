"use client";
import { useEffect, useState } from "react";
import { Search, Store as StoreIcon, Loader2, CalendarDays, MapPin, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { fmtDate } from "@/lib/utils";
import { STORE_COLS, type StoreLite } from "./types";

/** Tìm cửa hàng theo mã/tên (truy vấn server, RLS giới hạn theo quyền). Dùng tốt với 15.000 CH. */
export function StorePicker({ value, onChange }: { value: StoreLite | null; onChange: (s: StoreLite | null) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<StoreLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mine, setMine] = useState<StoreLite[] | null>(null);

  // Gợi ý ngay khi bấm vào ô: các cửa hàng trong phạm vi phụ trách (đã được RLS lọc theo quyền)
  async function loadMine() {
    setOpen(true);
    if (mine) return;
    const { data } = await createClient().from("stores").select(STORE_COLS).eq("is_active", true).order("code").limit(12);
    setMine((data as StoreLite[]) ?? []);
  }

  useEffect(() => {
    const term = q.trim();
    if (term.length < 1) return;
    const t = setTimeout(async () => {
      setLoading(true);
      const safe = term.replace(/[%,()]/g, "");
      const { data } = await createClient()
        .from("stores")
        .select(STORE_COLS)
        .eq("is_active", true)
        .or(`code.ilike.${safe}%,name.ilike.%${safe}%,address.ilike.%${safe}%,province.ilike.%${safe}%`)
        .order("code")
        .limit(20);
      setResults((data as StoreLite[]) ?? []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const typing = q.trim().length >= 1;
  const visible = typing ? results : open ? (mine ?? []) : [];

  if (value) {
    return (
      <div className="flex items-start gap-3 rounded-xl border-2 border-primary/30 bg-red-50/50 p-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white"><StoreIcon className="size-5" /></div>
        <div className="min-w-0 flex-1">
          <div className="font-black">{value.code} · <span className="font-semibold">{value.name}</span></div>
          {value.address && <div className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="mt-0.5 size-3 shrink-0" />{value.address}</div>}
          {value.email && <div className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-emerald-700"><Mail className="size-3 shrink-0" />Báo cáo sẽ gửi về: {value.email}</div>}
          {value.open_date && <div className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-blue-700"><CalendarDays className="size-3" />Khai trương: {fmtDate(value.open_date)}</div>}
        </div>
        <button type="button" className="text-xs font-bold text-primary" onClick={() => onChange(null)}>Đổi</button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Gõ mã, tên, địa chỉ hoặc tỉnh của cửa hàng..." onFocus={loadMine} onBlur={() => setTimeout(() => setOpen(false), 200)} className="h-12 pl-10" inputMode="search" />
      {loading && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      {visible.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border bg-white shadow-xl">
          {visible.map((s) => (
            <button key={s.id} type="button" onClick={() => { onChange(s); setQ(""); setResults([]); setOpen(false); }} className="block w-full border-b px-3 py-2.5 text-left last:border-0 active:bg-zinc-100">
              <div className="text-sm font-bold">{s.code} · {s.name}</div>
              <div className="truncate text-xs text-muted-foreground">{[s.province, s.address].filter(Boolean).join(" · ")}</div>
              {s.email && <div className="truncate text-[11px] text-emerald-700">✉ {s.email}</div>}
            </button>
          ))}
        </div>
      )}
      {typing && !loading && visible.length === 0 && (
        <p className="mt-1 text-xs text-muted-foreground">Không tìm thấy cửa hàng trong phạm vi được phân công.</p>
      )}
    </div>
  );
}
