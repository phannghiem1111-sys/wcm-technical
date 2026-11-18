import Link from "next/link";
import { ClipboardCheck, CalendarClock, Wrench, FileText, Percent, CalendarDays, AlertTriangle, Siren, ChevronRight, Package } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FORM_META, ROLE_LABEL, type FormType } from "@/lib/constants";
import { cn, fmtDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { TYPE_HEX, TYPE_SOFT, MR_SOFT } from "@/lib/dashboard-palette";
import { MonthlyChart, ResultPie } from "@/components/dashboard-charts";
import { ScoreBadge, StatusBadge } from "@/components/result-badge";

export const metadata = { title: "Tổng quan" };

type Stats = {
  total: number; avg_score: number; this_month: number; defects: number; urgent: number; pending: number; stores: number;
  by_type: Partial<Record<FormType, { count: number; avg: number }>>;
  by_month: { month: string; nso: number; periodic: number; maintenance: number; avg_score: number }[];
  top_defects: { item_text: string; section_title: string; cnt: number; urgent: number }[];
  by_region: { region: string; cnt: number; avg_score: number; defects: number }[];
  by_result: Record<string, number>;
};

const TYPE_ICON: Record<FormType, React.ComponentType<{ className?: string }>> = { nso: ClipboardCheck, periodic: CalendarClock, maintenance: Wrench };
const TYPE_KPI: Record<FormType, string> = { nso: "Đạt chuẩn", periodic: "Hoạt động tốt", maintenance: "Thiết bị ổn định" };
const QUICK_DESC: Record<FormType, string> = { nso: "Nghiệm thu CH mới", periodic: "Kiểm tra định kỳ", maintenance: "Bảo trì thiết bị" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ type?: string; months?: string }> }) {
  const sp = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();
  const type = (["nso", "periodic", "maintenance"] as const).find((t) => t === sp.type) ?? null;
  const months = [1, 3, 6, 12].includes(Number(sp.months)) ? Number(sp.months) : 6;

  const [{ data: statsRaw }, { data: recent }, { data: due }] = await Promise.all([
    supabase.rpc("dashboard_stats", { p_type: type, p_months: months }),
    supabase.from("v_inspections").select("id, code, form_type, status, inspection_date, store_code, store_name, score").order("created_at", { ascending: false }).limit(6),
    supabase.rpc("maintenance_due", { p_limit: 6 }),
  ]);
  const s = (statsRaw ?? { total: 0, avg_score: 0, this_month: 0, defects: 0, urgent: 0, pending: 0, stores: 0, by_type: {}, by_month: [], top_defects: [], by_region: [], by_result: {} }) as Stats;
  const maxDefect = Math.max(1, ...s.top_defects.map((d) => d.cnt));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Xin chào, <b className="text-foreground">{profile.full_name}</b> · {ROLE_LABEL[profile.role]}</p>
          <h1 className="text-2xl font-bold tracking-tight">Tổng quan số liệu</h1>
        </div>
        <form className="flex gap-2">
          <NativeSelect name="type" defaultValue={type ?? ""} className="w-40">
            <option value="">Tất cả phân hệ</option>
            <option value="nso">NSO</option>
            <option value="periodic">Định kỳ</option>
            <option value="maintenance">Bảo trì</option>
          </NativeSelect>
          <NativeSelect name="months" defaultValue={String(months)} className="w-32">
            <option value="1">Tháng này</option><option value="3">3 tháng</option><option value="6">6 tháng</option><option value="12">12 tháng</option>
          </NativeSelect>
          <Button type="submit" variant="dark">Xem</Button>
        </form>
      </div>

      {/* Thao tác nhanh */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {(Object.keys(FORM_META) as FormType[]).map((t) => {
          const Icon = TYPE_ICON[t];
          return <QuickAction key={t} href={`/inspections/new?type=${t}`} icon={Icon} tone={TYPE_SOFT[t]} title={`Phiếu ${FORM_META[t].short}`} desc={QUICK_DESC[t]} />;
        })}
        <QuickAction href="/vat-tu" icon={Package} tone={MR_SOFT} title="BBVT" desc="Biên bản vật tư" />
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
        <Kpi icon={FileText} label="Tổng biên bản" value={s.total} tone="bg-zinc-100 text-zinc-600" />
        <Kpi icon={Percent} label="Tỷ lệ đạt TB" value={`${Number(s.avg_score).toFixed(1)}%`} tone="bg-emerald-50 text-emerald-600" />
        <Kpi icon={CalendarDays} label="Trong tháng này" value={s.this_month} tone="bg-blue-50 text-blue-600" />
        <Kpi icon={AlertTriangle} label="Lỗi phát hiện" value={s.defects} tone="bg-red-50 text-red-600" valueClass={s.defects > 0 ? "text-red-600" : undefined} />
        <Kpi icon={Siren} label="Sửa chữa khẩn cấp" value={s.urgent} tone="bg-violet-50 text-violet-600" valueClass={s.urgent > 0 ? "text-violet-600" : undefined} />
      </div>

      {/* Hiệu suất theo phân hệ */}
      <div className="grid gap-3 md:grid-cols-3">
        {(Object.keys(FORM_META) as FormType[]).map((t) => {
          const v = s.by_type[t];
          const avg = Number(v?.avg ?? 0);
          const Icon = TYPE_ICON[t];
          return (
            <Card key={t}>
              <CardContent className="space-y-3 pt-4 sm:pt-5">
                <div className="flex items-center gap-2.5">
                  <span className={cn("flex size-8 items-center justify-center rounded-lg ring-1", TYPE_SOFT[t])}><Icon className="size-4" /></span>
                  <span className="flex-1 text-sm font-semibold first-letter:uppercase">{FORM_META[t].title.replace("Biên bản ", "")}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{v?.count ?? 0} phiếu</span>
                </div>
                <div className="flex items-baseline gap-2"><span className="text-3xl font-bold tracking-tight tabular-nums">{avg.toFixed(0)}%</span><span className="text-xs text-muted-foreground">{TYPE_KPI[t]}</span></div>
                <Progress value={avg} className="h-1.5" indicatorStyle={{ background: TYPE_HEX[t] }} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Số biên bản theo tháng</CardTitle></CardHeader>
          <CardContent><MonthlyChart data={s.by_month} months={months} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Phân loại lỗi</CardTitle></CardHeader>
          <CardContent><ResultPie data={s.by_result} /></CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top lỗi thường gặp</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {s.top_defects.length === 0 && <p className="text-sm text-muted-foreground">Chưa ghi nhận lỗi.</p>}
            {s.top_defects.map((d, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="line-clamp-2 font-medium">{d.item_text}</span>
                  <span className="shrink-0 font-bold tabular-nums text-red-600">{d.cnt}{d.urgent > 0 && <span className="ml-1 text-xs font-medium text-violet-600">({d.urgent} khẩn)</span>}</span>
                </div>
                <Progress value={(d.cnt / maxDefect) * 100} indicatorClassName="bg-red-400" className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Theo khu vực</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {s.by_region.length === 0 && <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>}
            {s.by_region.map((r) => (
              <div key={r.region} className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-sm">
                <span className="font-semibold">{r.region}</span>
                <span className="flex items-center gap-3 text-xs"><span>{r.cnt} phiếu</span><span className="font-bold text-red-600">{r.defects} lỗi</span><ScoreBadge score={r.avg_score} /></span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Hoạt động mới nhất</CardTitle><Link href="/inspections" className="text-sm font-semibold text-primary">Xem tất cả</Link></CardHeader>
          <CardContent className="space-y-1.5">
            {(recent ?? []).length === 0 && <p className="text-sm text-muted-foreground">Chưa có biên bản.</p>}
            {(recent ?? []).map((r) => (
              <Link key={r.id} href={`/inspections/${r.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-zinc-50">
                <span className={cn("w-14 shrink-0 rounded-md px-1.5 py-0.5 text-center text-[10px] font-bold uppercase ring-1", TYPE_SOFT[r.form_type as FormType])}>{FORM_META[r.form_type as FormType].short}</span>
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{r.store_code} · {r.store_name}</div><div className="text-xs text-muted-foreground">{fmtDate(r.inspection_date)}</div></div>
                <StatusBadge status={r.status} /><ScoreBadge score={r.score} />
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Cửa hàng đến hạn bảo trì</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {(due ?? []).length === 0 && <p className="text-sm text-muted-foreground">Không có cửa hàng đến hạn.</p>}
            {(due ?? []).map((r: { store_id: string; store_code: string; store_name: string; last_date: string | null; due_date: string }) => (
              <Link key={r.store_id} href={`/inspections/new?type=maintenance&store=${r.store_id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-zinc-50">
                <Wrench className="size-4 text-amber-600" />
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{r.store_code} · {r.store_name}</div><div className="text-xs text-muted-foreground">Lần gần nhất: {r.last_date ? fmtDate(r.last_date) : "chưa có"}</div></div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone, valueClass, href }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode; tone: string; valueClass?: string; href?: string }) {
  const body = (
    <Card className="h-full">
      <CardContent className="flex items-center gap-3 p-3 sm:p-4">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tone)}><Icon className="size-5" /></div>
        <div className="min-w-0"><div className={cn("text-xl font-bold tabular-nums tracking-tight", valueClass)}>{value}</div><div className="truncate text-xs text-muted-foreground">{label}</div></div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function QuickAction({ href, icon: Icon, tone, title, desc }: { href: string; icon: React.ComponentType<{ className?: string }>; tone: string; title: string; desc: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5 rounded-2xl border bg-card p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:border-zinc-300 hover:shadow-md active:scale-[0.98] sm:p-4">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl ring-1", tone)}><Icon className="size-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        <span className="hidden truncate text-xs text-muted-foreground sm:block">{desc}</span>
      </span>
      <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 sm:block" />
    </Link>
  );
}
