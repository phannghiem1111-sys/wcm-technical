import Link from "next/link";
import { ChevronRight, ExternalLink, Plus, Search } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MR_APP_URL, MR_CATEGORIES, MR_COLOR, MR_PROPOSALS } from "@/lib/material/constants";
import { fmtDateTime, cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "Biên bản vật tư" };
const PAGE = 30;

type F = { q?: string; cat?: string; dx?: string; month?: string; page?: string };
type Row = { id: string; code: string; report_at: string; store_code: string; store_name: string; reporter_name: string; reporter_msnv: string; category: string; category_other: string | null; subject: string | null; proposal: string; item_count: number; email_status: string | null };

export default async function MaterialReportsPage({ searchParams }: { searchParams: Promise<F> }) {
  const f = await searchParams;
  await requireProfile();
  const supabase = await createClient();
  const page = Math.max(1, Number(f.page) || 1);
  let q = supabase.from("v_material_reports").select("id, code, report_at, store_code, store_name, reporter_name, reporter_msnv, category, category_other, subject, proposal, item_count, email_status", { count: "exact" });
  if (f.q?.trim()) {
    const t = f.q.trim().replace(/[%,()]/g, "");
    q = q.or(`store_code.ilike.${t}%,store_name.ilike.%${t}%,code.ilike.%${t}%,reporter_msnv.ilike.${t}%,ticket_code.ilike.%${t}%`);
  }
  if (f.cat) q = q.eq("category", f.cat);
  if (f.dx) q = q.eq("proposal", f.dx);
  if (f.month && /^\d{4}-\d{2}$/.test(f.month)) {
    const [y, m] = f.month.split("-").map(Number);
    q = q.gte("report_at", new Date(y, m - 1, 1).toISOString()).lt("report_at", new Date(y, m, 1).toISOString());
  }
  const { data, count } = await q.order("report_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  const rows = (data ?? []) as Row[];
  const total = count ?? 0;
  const qs = (p: number) => new URLSearchParams({ ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)), page: String(p) }).toString();
  const cat = (r: Row) => (r.category === "Khác" && r.category_other ? r.category_other : r.category);

  return (
    <>
      <PageHeader title="Biên bản vật tư" desc={`Vật tư thay thế tại cửa hàng · ${total} biên bản`} actions={<><Button variant="outline" asChild><a href={MR_APP_URL} target="_blank" rel="noopener"><ExternalLink /> App Vật tư MN</a></Button><Button asChild><Link href="/material-reports/new"><Plus /> Lập biên bản</Link></Button></>} />
      <Card className="mb-4 p-3">
        <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={f.q} placeholder="Mã CH, tên CH, số BB, MSNV, ticket..." className="pl-9" />
          </div>
          <NativeSelect name="cat" defaultValue={f.cat ?? ""}>
            <option value="">Tất cả hạng mục</option>
            {MR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </NativeSelect>
          <NativeSelect name="dx" defaultValue={f.dx ?? ""}>
            <option value="">Tất cả đề xuất</option>
            {MR_PROPOSALS.map((c) => <option key={c} value={c}>{c}</option>)}
          </NativeSelect>
          <div className="flex gap-2">
            <Input type="month" name="month" defaultValue={f.month} className="flex-1" />
            <Button type="submit" variant="dark">Lọc</Button>
          </div>
        </form>
      </Card>

      <div className="space-y-2 md:hidden">
        {rows.map((r) => (
          <Link key={r.id} href={`/material-reports/${r.id}`} className="flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-sm active:bg-zinc-50">
            <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl text-[10px] font-black uppercase text-white", MR_COLOR)}>BBVT</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{r.store_code} · {r.store_name}</div>
              <div className="truncate text-xs text-muted-foreground">{fmtDateTime(r.report_at)} · {cat(r)} · {r.item_count} VT</div>
              <div className="truncate text-xs font-semibold">{r.proposal} · {r.reporter_name}</div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <Card className="hidden overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời gian</TableHead><TableHead>Số BB</TableHead><TableHead>Cửa hàng</TableHead><TableHead>Hạng mục</TableHead>
              <TableHead>V/v</TableHead><TableHead className="text-center">Vật tư</TableHead><TableHead>Đề xuất</TableHead><TableHead>Người lập</TableHead><TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">{fmtDateTime(r.report_at)}</TableCell>
                <TableCell className="font-mono text-xs">{r.code}</TableCell>
                <TableCell><b>{r.store_code}</b> <span className="text-muted-foreground">{r.store_name}</span></TableCell>
                <TableCell>{cat(r)}</TableCell>
                <TableCell className="max-w-64 truncate">{r.subject}</TableCell>
                <TableCell className="text-center">{r.item_count}</TableCell>
                <TableCell className="font-semibold">{r.proposal}</TableCell>
                <TableCell className="whitespace-nowrap">{r.reporter_msnv} – {r.reporter_name}</TableCell>
                <TableCell><Button size="sm" variant="outline" asChild><Link href={`/material-reports/${r.id}`}>Xem</Link></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {rows.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">Chưa có biên bản vật tư.</p>}
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
