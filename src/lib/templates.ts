import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FormType } from "@/lib/constants";
import type { TemplateSection } from "@/components/inspection/types";

export async function loadTemplate(supabase: SupabaseClient, formType: FormType): Promise<TemplateSection[]> {
  const { data } = await supabase
    .from("checklist_sections")
    .select("id, code, title, equipment_label, default_count, sort, checklist_items(id, code, text, sort, is_active)")
    .eq("form_type", formType)
    .eq("is_active", true)
    .order("sort");
  type Row = TemplateSection & { checklist_items: { id: number; code: string; text: string; sort: number; is_active: boolean }[] };
  return ((data as Row[] | null) ?? []).map((s) => ({
    id: s.id,
    code: s.code,
    title: s.title,
    equipment_label: s.equipment_label,
    default_count: s.default_count,
    items: s.checklist_items.filter((i) => i.is_active).sort((a, b) => a.sort - b.sort).map(({ id, code, text }) => ({ id, code, text })),
  }));
}
