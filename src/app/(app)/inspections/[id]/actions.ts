"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function reviewInspection(id: string, status: "approved" | "rejected", note: string) {
  await requireProfile(["admin", "truong_bo_phan", "doi_truong"]);
  const supabase = await createClient();
  const { error, data } = await supabase.from("inspections").update({ status, approval_note: note || null }).eq("id", id).select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "Không có quyền duyệt biên bản này" };
  revalidatePath(`/inspections/${id}`);
  return { ok: true };
}

export async function deleteInspection(id: string) {
  await requireProfile(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase.from("inspections").delete().eq("id", id);
  if (error) return { error: error.message };
  redirect("/inspections");
}
