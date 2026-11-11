import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FORM_META, type FormType } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FrequencyInput, ItemDialog } from "./settings-forms";

export const metadata = { title: "Cấu hình checklist" };

type Sec = { id: number; form_type: FormType; code: string; title: string; equipment_label: string | null; checklist_items: { id: number; text: string; sort: number; is_active: boolean }[]; maintenance_frequencies: { interval_days: number } | null };

export default async function SettingsPage() {
  await requireProfile(["admin"]);
  const supabase = await createClient();
  const { data } = await supabase.from("checklist_sections")
    .select("id, form_type, code, title, equipment_label, sort, checklist_items(id, text, sort, is_active), maintenance_frequencies(interval_days)")
    .order("form_type").order("sort");
  const sections = (data ?? []) as unknown as Sec[];
  const maint = sections.filter((s) => s.form_type === "maintenance");

  return (
    <>
      <PageHeader title="Cấu hình hệ thống" desc="Tần suất bảo trì và nội dung biểu mẫu kiểm tra" />
      <Card className="mb-4">
        <CardHeader><CardTitle>Tần suất bảo trì theo nhóm thiết bị</CardTitle><CardDescription>Dùng để nhắc cửa hàng đến hạn bảo trì trên Dashboard</CardDescription></CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {maint.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border px-3 py-2">
              <span className="text-sm font-semibold">{s.title}</span>
              <FrequencyInput sectionId={s.id} value={s.maintenance_frequencies?.interval_days ?? 90} />
            </div>
          ))}
        </CardContent>
      </Card>

      {(["nso", "periodic", "maintenance"] as FormType[]).map((t) => (
        <div key={t} className="mb-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-black"><span className={cn("rounded px-2 py-0.5 text-xs text-white", FORM_META[t].color)}>{FORM_META[t].short}</span>{FORM_META[t].title}</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {sections.filter((s) => s.form_type === t).map((s) => (
              <Card key={s.id}>
                <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-sm uppercase">{s.title}</CardTitle><ItemDialog sectionId={s.id} /></CardHeader>
                <CardContent className="space-y-1">
                  {s.checklist_items.sort((a, b) => a.sort - b.sort).map((it, i) => (
                    <div key={it.id} className={cn("flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-zinc-50", !it.is_active && "opacity-40 line-through")}>
                      <span className="text-zinc-400">{i + 1}.</span><span className="flex-1">{it.text}</span><ItemDialog sectionId={s.id} item={it} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
