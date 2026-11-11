import type { SupabaseClient } from "@supabase/supabase-js";

export type InspectionFilters = { type?: string; status?: string; month?: string; q?: string; region?: string; page?: string };

/** month: YYYY-MM */
export function applyInspectionFilters(supabase: SupabaseClient, f: InspectionFilters, select = "*", opts?: { count?: "exact" }) {
  let q = supabase.from("v_inspections").select(select, opts);
  if (f.type) q = q.eq("form_type", f.type);
  if (f.status) q = q.eq("status", f.status);
  if (f.region) q = q.eq("region_id", Number(f.region));
  if (f.month && /^\d{4}-\d{2}$/.test(f.month)) {
    const [y, m] = f.month.split("-").map(Number);
    const end = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
    q = q.gte("inspection_date", `${f.month}-01`).lt("inspection_date", end);
  }
  if (f.q) {
    const s = f.q.replace(/[%,()]/g, "").trim();
    if (s) q = q.or(`store_code.ilike.${s}%,store_name.ilike.%${s}%,code.ilike.%${s}%,inspector_msnv.ilike.${s}%`);
  }
  return q;
}
