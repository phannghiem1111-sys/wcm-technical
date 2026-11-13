import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadMaterialReport } from "@/lib/material/data";
import { PageHeader } from "@/components/page-header";
import { MaterialFormLoader as MaterialForm } from "@/components/material/material-form-loader";
import { STORE_COLS, type StoreLite } from "@/components/inspection/types";

export const metadata = { title: "Sửa biên bản vật tư" };

export default async function EditMaterialReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();
  const data = await loadMaterialReport(supabase, id);
  if (!data) notFound();
  const { report: r, items, urls } = data;
  if (r.reporter_id !== profile.id && profile.role !== "admin") redirect(`/material-reports/${id}`);
  const { data: store } = await supabase.from("stores").select(STORE_COLS).eq("id", r.store_id).maybeSingle();
  if (!store) notFound();
  return (
    <>
      <PageHeader title={`Sửa biên bản ${r.code}`} desc="Lưu lại sẽ gửi mail bản mới" />
      <MaterialForm
        reporter={{ full_name: r.reporter_name, msnv: r.reporter_msnv, title: r.reporter_title }}
        initial={{
          id: r.id, store: store as StoreLite, report_at: r.report_at, category: r.category, category_other: r.category_other, ticket_code: r.ticket_code,
          store_manager_name: r.store_manager_name, email_to: r.email_to, incident: r.incident, solution: r.solution, proposal: r.proposal,
          items: items.map((x) => ({ material_code: x.material_code, material_name: x.material_name, unit: x.unit, qty: Number(x.qty) })),
          photos: [...r.photos_before.map((p) => ({ path: p, url: urls.get(p), phase: "before" as const })), ...r.photos_after.map((p) => ({ path: p, url: urls.get(p), phase: "after" as const }))],
          hasSignature: Boolean(r.signature_reporter),
        }}
      />
    </>
  );
}
