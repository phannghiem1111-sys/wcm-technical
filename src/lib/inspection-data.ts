import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKET, type FormType, type ItemResult } from "@/lib/constants";

export type InspectionFull = {
  id: string; code: string; form_type: FormType; status: string; inspection_date: string; created_at: string;
  store_code: string; store_name: string; store_address: string | null; province: string | null; region_name: string | null;
  inspector_name: string; inspector_msnv: string; overall_note: string | null; device_config: Record<string, number> | null;
  total_items: number; pass_items: number; fail_items: number; urgent_items: number; score: number;
  store_rep_name: string | null; signature_inspector: string | null; signature_store: string | null;
  approved_by: string | null; approved_at: string | null; approval_note: string | null; store_id: string; inspector_id: string;
  plan_id: string | null;
};
export type ItemRow = {
  id: number; item_key: string; section_title: string; item_text: string; result: ItemResult | null; note: string | null; proposal: string | null;
  equipment_name: string | null; model: string | null; before_status: ItemResult | null; work_done: string | null; materials: string | null;
  after_status: string | null; completion: string | null; sort: number;
};
export type PhotoRow = { id: string; item_key: string; path: string; caption: string | null; phase: string; taken_at: string; msnv: string; url?: string };

export async function loadInspection(supabase: SupabaseClient, id: string) {
  const { data: insp } = await supabase.from("v_inspections").select("*").eq("id", id).maybeSingle();
  if (!insp) return null;
  const [{ data: items }, { data: photos }, approver] = await Promise.all([
    supabase.from("inspection_items").select("*").eq("inspection_id", id).order("sort"),
    supabase.from("inspection_photos").select("id, item_key, path, caption, phase, taken_at, msnv").eq("inspection_id", id).order("taken_at"),
    insp.approved_by ? supabase.from("profiles").select("full_name, msnv").eq("id", insp.approved_by).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const paths = [...(photos ?? []).map((p) => p.path), insp.signature_inspector, insp.signature_store].filter(Boolean) as string[];
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrls(paths, 60 * 60);
    data?.forEach((x) => x.path && x.signedUrl && urls.set(x.path, x.signedUrl));
  }
  return {
    inspection: insp as InspectionFull,
    items: (items ?? []) as ItemRow[],
    photos: ((photos ?? []) as PhotoRow[]).map((p) => ({ ...p, url: urls.get(p.path) })),
    signatureUrls: { inspector: insp.signature_inspector ? urls.get(insp.signature_inspector) : undefined, store: insp.signature_store ? urls.get(insp.signature_store) : undefined },
    approver: (approver.data as { full_name: string; msnv: string } | null) ?? null,
  };
}

export function groupBySection<T extends { section_title: string }>(rows: T[]) {
  const map = new Map<string, T[]>();
  rows.forEach((r) => { const arr = map.get(r.section_title) ?? []; arr.push(r); map.set(r.section_title, arr); });
  return Array.from(map.entries());
}
