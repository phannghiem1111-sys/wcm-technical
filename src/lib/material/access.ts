import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/auth";
import { MATERIAL_APP_KEYS, MATERIAL_APPS, type MaterialAppKey } from "./constants";

/** App vật tư người dùng được mở: Admin/Trưởng phòng thấy tất cả, còn lại theo miền phụ trách (vùng chính + vùng phụ). */
export async function allowedMaterialApps(p: Profile & { extra_region_ids?: number[] | null }): Promise<MaterialAppKey[]> {
  if (p.role === "admin" || p.role === "truong_phong") return MATERIAL_APP_KEYS;
  const ids = [p.region_id, ...(p.extra_region_ids ?? [])].filter((x): x is number => x != null);
  if (!ids.length) return MATERIAL_APP_KEYS;
  const supabase = await createClient();
  const { data } = await supabase.from("regions").select("code").in("id", ids);
  const codes = (data ?? []).map((r) => r.code as string);
  const keys = MATERIAL_APP_KEYS.filter((k) => MATERIAL_APPS[k].regions.some((c) => codes.includes(c)));
  return keys.length ? keys : MATERIAL_APP_KEYS;
}
