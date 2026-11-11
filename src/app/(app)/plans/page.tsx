import Link from "next/link";
import { Plus, CalendarCheck } from "lucide-react";
import { requireProfile, isManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FORM_META, PERIOD_LABEL, type FormType } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Kế hoạch kiểm tra" };

export default async function PlansPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: plans } = await supabase.from("inspection_plans")
    .select("id, name, period, form_type, start_date, end_date, regions(name), plan_stores(count)")
    .order("start_date", { ascending: false }).limit(100);
  const ids = (plans ?? []).map((p) => p.id);
  const { data: done } = ids.length ? await supabase.from("inspections").select("plan_id, store_id").in("plan_id", ids) : { data: [] };
  const doneMap = new Map<string, Set<string>>();
  (done ?? []).forEach((d) => { const s = doneMap.get(d.plan_id) ?? new Set(); s.add(d.store_id); doneMap.set(d.plan_id, s); });
  const today = new Date().toLocaleDateString("en-CA");

  return (
    <>
      <PageHeader
        title="Kế hoạch kiểm tra định kỳ"
        desc="Thiết lập theo tháng, quý, năm hoặc chiến dịch"
        actions={isManager(profile.role) && <Button asChild><Link href="/plans/new"><Plus /> Tạo kế hoạch</Link></Button>}
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(plans ?? []).map((p) => {
          const total = (p.plan_stores as unknown as { count: number }[])[0]?.count ?? 0;
          const d = doneMap.get(p.id)?.size ?? 0;
          const pct = total ? Math.round((d / total) * 100) : 0;
          const active = p.start_date <= today && today <= p.end_date;
          return (
            <Link key={p.id} href={`/plans/${p.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{fmtDate(p.start_date)} – {fmtDate(p.end_date)} · {(p.regions as unknown as { name: string } | null)?.name ?? "Toàn quốc"}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="info">{PERIOD_LABEL[p.period]}</Badge>
                      {active ? <Badge variant="success">Đang chạy</Badge> : p.end_date < today ? <Badge variant="secondary">Đã kết thúc</Badge> : <Badge variant="warning">Sắp tới</Badge>}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm"><span>{FORM_META[p.form_type as FormType].short}</span><b>{d}/{total} CH · {pct}%</b></div>
                  <Progress value={pct} indicatorClassName={pct === 100 ? "bg-emerald-500" : undefined} />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      {(plans ?? []).length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground"><CalendarCheck className="size-10" /> Chưa có kế hoạch nào.</div>
      )}
    </>
  );
}
