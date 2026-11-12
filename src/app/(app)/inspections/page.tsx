import Link from "next/link";
import { FileSpreadsheet, ChevronRight, Search } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { applyInspectionFilters, type InspectionFilters } from "@/lib/filters";
import { canExport, FORM_META, STATUS_LABEL, type FormType } from "@/lib/constants";
import { fmtDate, cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScoreBadge, StatusBadge } from "@/components/result-badge";

export const metadata = { title: "Kho biên bản" };
const PAGE = 30;

type Row = { id: string; code: string; form_type: FormType; status: string; inspection_date: string; store_code: string; store_name: string; inspector_name: string; inspector_msnv: string; score: number; fail_items: number };

export default async function InspectionsPage({ searchParams }: { searchParams: Promise<InspectionFilters> }) {
  const f = await searchParams;
  const me = await requireProfile();
  const supabase = await createClient();
  const page = Math.max(1, Number(f.page) || 1);
  const { data, count } = await applyInspectionFilters(supabase, f, "id, code, form_type, status, inspection_date, store_code, store_name, inspector_name, inspector_msnv, score, fail_items", { count: "exact" })
    .order("inspection_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  const rows = (data ?? []) as unknown as Row[];
  const total = count ?? 0;
  const qs = (p: number) => new URLSearchParams({ ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)), page: String(p) }).toString();
  const exportQs = new URLSearchParams(Object.entries(f).filter(([k, v]) => v && k !== "page") as [string, string][]).toString();

  return (
    <>
      <PageHeader
        title="Kho biên bản & lịch sử"
        desc={`Lưu trữ toàn bộ biên bản NSO, kiểm tra định kỳ và bảo trì · ${total} kết quả`}
        actions={canExport(me.role) && <Button variant="outline" asChild><a href={`/api/inspections/export?${exportQs}`}><FileSpreadsheet className="text-emerald-600" /> Xuất Excel</a></Button>}
      />
      <Card className="mb-4 p-3">
        <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={f.q} placeholder="Mã CH, tên CH, số biên bản, MSNV..." className="pl-9" />
          </div>
          <NativeSelect name="type" defaultValue={f.type ?? ""}>
            <option value="">Tất cả loại biên bản</option>
            {Object.entries(FORM_META).map(([k, m]) => <option key={k} value={k}>{m.short}</option>)}
          </NativeSelect>
          <NativeSelect name="status" defaultValue={f.status ?? ""}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </NativeSelect>
          <div className="flex gap-2">
            <Input type="month" name="month" defaultValue={f.month} className="flex-1" />
            <Button type="submit" variant="dark">Lọc</Button>
          </div>
        </form>
      </Card>

      {/* Mobile: thẻ */}
      <div className="space-y-2 md:hidden">
        {rows.map((r) => (
          <Link key={r.id} href={`/inspections/${r.id}`} className="flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-sm active:bg-zinc-50">
            <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl text-[10px] font-black uppercase text-white", FORM_META[r.form_type].color)}>{FORM_META[r.form_type].short}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{r.store_code} · {r.store_name}</div>
              <div className="truncate text-xs text-muted-foreground">{fmtDate(r.inspection_date)} · {r.inspector_name}</div>
              <div className="mt-1 flex gap-1.5"><StatusBadge status={r.status} />{r.fail_items > 0 && <span className="text-xs font-bold text-red-600">{r.fail_items} lỗi</span>}</div>
            </div>
            <ScoreBadge score={r.score} />
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </div>

      {/* Desktop: bảng */}
      <Card className="hidden overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ngày</TableHead><TableHead>Số biên bản</TableHead><TableHead>Cửa hàng</TableHead><TableHead>Loại</TableHead>
              <TableHead>Nhân viên</TableHead><TableHead className="text-center">Tỷ lệ đạt</TableHead><TableHead className="text-center">Lỗi</TableHead><TableHead>Trạng thái</TableHead><TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">{fmtDate(r.inspection_date)}</TableCell>
                <TableCell className="font-mono text-xs">{r.code}</TableCell>
                <TableCell><b>{r.store_code}</b> <span className="text-muted-foreground">{r.store_name}</span></TableCell>
                <TableCell><span className={cn("rounded px-2 py-0.5 text-xs font-bold text-white", FORM_META[r.form_type].color)}>{FORM_META[r.form_type].short}</span></TableCell>
                <TableCell className="whitespace-nowrap">{r.inspector_msnv} – {r.inspector_name}</TableCell>
                <TableCell className="text-center"><ScoreBadge score={r.score} /></TableCell>
                <TableCell className="text-center font-bold text-red-600">{r.fail_items || ""}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell><Button size="sm" variant="outline" asChild><Link href={`/inspections/${r.id}`}>Xem</Link></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {rows.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">Chưa có biên bản phù hợp.</p>}
      {total > PAGE && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && <Button variant="outline" asChild><Link href={`?${qs(page - 1)}`}>← Trước</Link></Button>}
          <span className="text-sm font-semibold">Trang {page}/{Math.ceil(total / PAGE)}</span>
          {page * PAGE < total && <Button variant="outline" asChild><Link href={`?${qs(page + 1)}`}>Sau →</Link></Button>}
        </div>
      )}
    </>
  );
}
