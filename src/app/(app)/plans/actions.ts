"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export type ActionState = { error?: string; ok?: string } | undefined;

export async function createPlan(_: ActionState, fd: FormData): Promise<ActionState> {
  const profile = await requireProfile(["admin", "truong_phong", "truong_bo_phan", "doi_truong"]);
  const supabase = await createClient();
  const name = String(fd.get("name") ?? "").trim();
  const period = String(fd.get("period"));
  const form_type = String(fd.get("form_type") || "periodic");
  const start_date = String(fd.get("start_date"));
  const end_date = String(fd.get("end_date"));
  const region_id = fd.get("region_id") ? Number(fd.get("region_id")) : null;
  const scope = String(fd.get("scope"));
  const codes = String(fd.get("codes") ?? "").split(/[\s,;]+/).map((c) => c.trim().toUpperCase()).filter(Boolean);
  if (!name || !start_date || !end_date) return { error: "Nhập đủ tên, ngày bắt đầu, ngày kết thúc" };
  if (end_date < start_date) return { error: "Ngày kết thúc phải sau ngày bắt đầu" };

  let storeQuery = supabase.from("stores").select("id, staff_id").eq("is_active", true);
  if (scope === "codes") {
    if (!codes.length) return { error: "Nhập danh sách mã cửa hàng" };
    storeQuery = storeQuery.in("code", codes);
  } else if (region_id) storeQuery = storeQuery.eq("region_id", region_id);
  const { data: stores, error: sErr } = await storeQuery.limit(20000);
  if (sErr) return { error: sErr.message };
  if (!stores?.length) return { error: "Không có cửa hàng nào trong phạm vi bạn quản lý" };

  const { data: plan, error } = await supabase.from("inspection_plans")
    .insert({ name, period, form_type, start_date, end_date, region_id, note: String(fd.get("note") ?? "") || null, created_by: profile.id })
    .select("id").single();
  if (error) return { error: error.message };

  for (let i = 0; i < stores.length; i += 1000) {
    const { error: e } = await supabase.from("plan_stores").insert(
      stores.slice(i, i + 1000).map((s) => ({ plan_id: plan.id, store_id: s.id, assignee_id: s.staff_id, due_date: end_date })),
    );
    if (e) return { error: e.message };
  }
  revalidatePath("/plans");
  redirect(`/plans/${plan.id}`);
}

export async function deletePlan(id: string) {
  await requireProfile(["admin", "truong_phong", "truong_bo_phan", "doi_truong"]);
  const supabase = await createClient();
  await supabase.from("inspection_plans").delete().eq("id", id);
  revalidatePath("/plans");
  redirect("/plans");
}
