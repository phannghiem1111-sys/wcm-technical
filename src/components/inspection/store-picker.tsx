"use client";
import { useEffect, useState } from "react";
import { Search, Store as StoreIcon, Loader2, CalendarDays, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { fmtDate } from "@/lib/utils";
import type { StoreLite } from "./types";

/** Tìm cửa hàng theo mã/tên (truy vấn server, RLS giới hạn theo quyền). Dùng tốt với 15.000 CH. */
export function StorePicker({ value, onChange }: { value: StoreLite | null; onChange: (s: StoreLite | null) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<StoreLite[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const t = setTimeout(async () => {
      setLoading(true);
      const safe = term.replace(/[%,()]/g, "");
      const { data } = await createClient()
        .from("stores")
        .select("id, code, name, address, open_date")
        .eq("is_active", true)
        .or(`code.ilike.${safe}%,name.ilike.%${safe}%`)
        .order("code")
        .limit(15);
      setResults((data as StoreLite[]) ?? []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const visible = q.trim().length >= 2 ? results : [];

  if (value) {
    return (
      <div className="flex items-start gap-3 rounded-xl border-2 border-primary/30 bg-red-50/50 p-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white"><StoreIcon className="size-5" /></div>
        <div className="min-w-0 flex-1">
          <div className="font-black">{value.code} · <span className="font-semibold">{value.name}</span></div>
          {value.address && <div className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="mt-0.5 size-3 shrink-0" />{value.address}</div>}
          {value.open_date && <div className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-blue-700"><CalendarDays className="size-3" />Khai trương: {fmtDate(value.open_date)}</div>}
        </div>
        <button type="button" className="text-xs font-bold text-primary" onClick={() => onChange(null)}>Đổi</button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Gõ mã hoặc tên cửa hàng..." className="h-12 pl-10" inputMode="search" />
      {loading && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      {visible.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border bg-white shadow-xl">
          {visible.map((s) => (
            <button key={s.id} type="button" onClick={() => { onChange(s); setQ(""); setResults([]); }} className="block w-full border-b px-3 py-2.5 text-left last:border-0 active:bg-zinc-100">
              <div className="text-sm font-bold">{s.code} · {s.name}</div>
              {s.address && <div className="truncate text-xs text-muted-foreground">{s.address}</div>}
            </button>
          ))}
        </div>
      )}
      {q.trim().length >= 2 && !loading && visible.length === 0 && (
        <p className="mt-1 text-xs text-muted-foreground">Không tìm thấy cửa hàng trong phạm vi được phân công.</p>
      )}
    </div>
  );
}
