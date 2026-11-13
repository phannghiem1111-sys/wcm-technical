import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKET } from "@/lib/constants";

export type MaterialReport = {
  id: string; code: string; store_id: string; store_code: string; store_name: string; store_address: string | null; province: string | null;
  store_email: string | null; reporter_id: string; reporter_name: string; reporter_msnv: string; reporter_title: string | null;
  report_at: string; subject: string | null; category: string; category_other: string | null; ticket_code: string | null;
  store_manager_name: string | null; email_to: string | null; incident: string; solution: string; proposal: string;
  photos_before: string[]; photos_after: string[]; signature_reporter: string | null; signature_store: string | null;
  emailed_at: string | null; email_status: string | null; created_at: string; item_count: number;
};
export type MaterialItem = { id: number; sort: number; material_code: string | null; material_name: string; unit: string | null; qty: number };

export async function loadMaterialReport(supabase: SupabaseClient, id: string) {
  const { data: r } = await supabase.from("v_material_reports").select("*").eq("id", id).maybeSingle();
  if (!r) return null;
  const report = r as MaterialReport;
  const { data: items } = await supabase.from("material_report_items").select("*").eq("report_id", id).order("sort");
  const paths = [...report.photos_before, ...report.photos_after, report.signature_reporter, report.signature_store].filter(Boolean) as string[];
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrls(paths, 60 * 60);
    data?.forEach((x) => x.path && x.signedUrl && urls.set(x.path, x.signedUrl));
  }
  return { report, items: (items ?? []) as MaterialItem[], urls };
}
