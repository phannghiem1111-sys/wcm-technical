import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FORM_META, PERIOD_LABEL, type FormType } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { deletePlan } from "../actions";

export default async function PlanDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; only?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: plan } = await supabase.from("inspection_plans").select("*, regions(name)").eq("id", id).maybeSingle();
  if (!plan) notFound();
  const { data: ps } = await supabase.from("plan_stores")
    .select("store_id, due_date, stores(code, name, address), profiles:assignee_id(full_name, msnv)")
    .eq("plan_id", id).limit(20000);
  const { data: done } = await supabase.from("inspections").select("id, store_id, score").eq("plan_id", id);
  const doneMap = new Map((done ?? []).map((d) => [d.store_id, d]));
  type PS = { store_id: string; due_date: string; stores: { code: string; name: string; address: string | null }; profiles: { full_name: string; msnv: string } | null };
  let rows = (ps ?? []) as unknown as PS[];
  const total = rows.length;
  const doneCount = rows.filter((r) => doneMap.has(r.store_id)).length;
  if (sp.q) rows = rows.filter((r) => `${r.stores.code} ${r.stores.name}`.toLowerCase().includes(sp.q!.toLowerCase()));
  if (sp.only === "todo") rows = rows.filter((r) => !doneMap.has(r.store_id));
  if (profile.role === "nhan_vien" && sp.only !== "all") rows = rows.sort((a) => (a.profiles?.msnv === profile.msnv ? -1 : 1));
  rows = rows.slice(0, 300);
  const canDelete = profile.role === "admin" || plan.created_by === profile.id;

  return (
    <>
      <Button variant="ghost" asChild className="-ml-2 mb-2"><Link href="/plans"><ArrowLeft /> Kế hoạch</Link></Button>
      <PageHeader
        title={plan.name}
        desc={`${PERIOD_LABEL[plan.period]} · ${FORM_META[plan.form_type as FormType].short} · ${fmtDate(plan.start_date)} – ${fmtDate(plan.end_date)} · ${plan.regions?.name ?? "Toàn quốc"}`}
        actions={canDelete && <form action={deletePlan.bind(null, id)}><Button variant="ghost" className="text-red-600"><Trash2 /> Xóa</Button></form>}
      />
      <Card className="mb-4 space-y-2 p-4">
        <div className="flex justify-between text-sm font-bold"><span>Tiến độ</span><span>{doneCount}/{total} cửa hàng</span></div>
        <Progress value={total ? (doneCount / total) * 100 : 0} />
      </Card>
      <form className="mb-3 flex gap-2">
        <Input name="q" defaultValue={sp.q} placeholder="Tìm cửa hàng..." />
        <label className="flex shrink-0 items-center gap-1.5 text-sm"><input type="checkbox" name="only" value="todo" defaultChecked={sp.only === "todo"} className="size-4" /> Chưa làm</label>
        <Button variant="dark">Lọc</Button>
      </form>
      <div className="space-y-2">
        {rows.map((r) => {
          const d = doneMap.get(r.store_id);
          return (
            <Card key={r.store_id} className="flex items-center gap-3 p-3">
              {d ? <CheckCircle2 className="size-6 shrink-0 text-emerald-500" /> : <Circle className="size-6 shrink-0 text-zinc-300" />}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{r.stores.code} · {r.stores.name}</div>
                <div className="truncate text-xs text-muted-foreground">{r.profiles ? `${r.profiles.msnv} – ${r.profiles.full_name}` : "Chưa phân công"} · Hạn {fmtDate(r.due_date)}</div>
              </div>
              {d ? (
                <Button size="sm" variant="outline" asChild><Link href={`/inspections/${d.id}`}>Xem</Link></Button>
              ) : (
                <Button size="sm" asChild><Link href={`/inspections/new?type=${plan.form_type}&store=${r.store_id}&plan=${id}`}>Thực hiện</Link></Button>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
