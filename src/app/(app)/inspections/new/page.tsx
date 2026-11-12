import Link from "next/link";
import { ClipboardCheck, CalendarClock, Wrench, ChevronRight } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadTemplate } from "@/lib/templates";
import { FORM_META, type FormType } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { InspectionFormLoader as InspectionForm } from "@/components/inspection/inspection-form-loader";
import type { StoreLite } from "@/components/inspection/types";

export const metadata = { title: "Tạo phiếu kiểm tra" };

const ICONS: Record<FormType, React.ComponentType<{ className?: string }>> = { nso: ClipboardCheck, periodic: CalendarClock, maintenance: Wrench };
const TYPES: FormType[] = ["nso", "periodic", "maintenance"];

export default async function NewInspectionPage({ searchParams }: { searchParams: Promise<{ type?: string; store?: string; plan?: string }> }) {
  const sp = await searchParams;
  const profile = await requireProfile();
  const type = TYPES.includes(sp.type as FormType) ? (sp.type as FormType) : null;

  if (!type) {
    return (
      <>
        <PageHeader title="Tạo phiếu kiểm tra" desc="Chọn loại biên bản cần thực hiện" />
        <div className="grid gap-3 md:grid-cols-3">
          {TYPES.map((t) => {
            const Icon = ICONS[t];
            const m = FORM_META[t];
            return (
              <Link key={t} href={`/inspections/new?type=${t}`} className="group flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-all active:scale-[0.99] md:flex-col md:items-start">
                <div className={`flex size-14 items-center justify-center rounded-2xl text-white ${m.color}`}><Icon className="size-7" /></div>
                <div className="flex-1">
                  <div className="text-lg font-black">{m.title}</div>
                  <div className="text-sm text-muted-foreground">{m.desc}</div>
                </div>
                <ChevronRight className="size-5 text-muted-foreground md:hidden" />
              </Link>
            );
          })}
        </div>
      </>
    );
  }

  const supabase = await createClient();
  const [sections, storeRes, planRes] = await Promise.all([
    loadTemplate(supabase, type),
    sp.store ? supabase.from("stores").select("id, code, name, address, open_date, province, email, manager_name").eq("id", sp.store).maybeSingle() : Promise.resolve({ data: null }),
    sp.plan ? supabase.from("inspection_plans").select("id, name").eq("id", sp.plan).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  return (
    <>
      <PageHeader title={FORM_META[type].title} desc={FORM_META[type].desc} />
      <InspectionForm
        key={`${type}-${sp.store ?? ""}-${sp.plan ?? ""}`}
        formType={type}
        sections={sections}
        inspector={{ full_name: profile.full_name, msnv: profile.msnv }}
        initialStore={(storeRes.data as StoreLite | null) ?? null}
        planId={(planRes.data as { id: string } | null)?.id ?? null}
        planName={(planRes.data as { name: string } | null)?.name ?? null}
      />
    </>
  );
}
