"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { msnvToEmail, ROLE_ORDER, type AppRole } from "@/lib/constants";

export type ActionState = { error?: string; ok?: string } | undefined;

function genPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return "Wcm@" + Array.from(crypto.getRandomValues(new Uint32Array(6)), (n) => chars[n % chars.length]).join("");
}

export async function saveUser(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireProfile(["admin"]);
  const admin = createAdminClient();
  const id = String(fd.get("id") ?? "");
  const msnv = String(fd.get("msnv") ?? "").trim().toUpperCase();
  const role = String(fd.get("role")) as AppRole;
  if (!ROLE_ORDER.includes(role)) return { error: "Vai trò không hợp lệ" };
  const leadMsnv = String(fd.get("team_lead_msnv") ?? "").trim().toUpperCase();
  let team_lead_id: string | null = null;
  if (leadMsnv) {
    const { data } = await admin.from("profiles").select("id").eq("msnv", leadMsnv).maybeSingle();
    if (!data) return { error: `Không tìm thấy đội trưởng ${leadMsnv}` };
    team_lead_id = data.id;
  }
  const profile = {
    msnv,
    full_name: String(fd.get("full_name") ?? "").trim(),
    title: String(fd.get("title") ?? "").trim() || null,
    role,
    region_id: fd.get("region_id") ? Number(fd.get("region_id")) : null,
    province: String(fd.get("province") ?? "").trim() || null,
    phone: String(fd.get("phone") ?? "").trim() || null,
    team_lead_id,
  };
  if (!msnv || !profile.full_name) return { error: "Nhập MSNV và họ tên" };

  if (id) {
    const { error } = await admin.from("profiles").update(profile).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin/users");
    return { ok: "Đã cập nhật tài khoản" };
  }
  const password = String(fd.get("password") ?? "").trim() || genPassword();
  if (password.length < 8) return { error: "Mật khẩu tối thiểu 8 ký tự" };
  const { data: created, error } = await admin.auth.admin.createUser({ email: msnvToEmail(msnv), password, email_confirm: true, user_metadata: { msnv } });
  if (error || !created.user) return { error: error?.message.includes("already") ? "MSNV đã tồn tại" : error?.message };
  const { error: pErr } = await admin.from("profiles").insert({ id: created.user.id, ...profile });
  if (pErr) { await admin.auth.admin.deleteUser(created.user.id); return { error: pErr.code === "23505" ? "MSNV đã tồn tại" : pErr.message }; }
  revalidatePath("/admin/users");
  return { ok: `Đã tạo tài khoản ${msnv}. Mật khẩu: ${password}` };
}

export async function setUserStatus(id: string, status: "active" | "locked") {
  const me = await requireProfile(["admin"]);
  if (id === me.id) return { error: "Không thể tự khóa tài khoản của mình" };
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  await admin.auth.admin.updateUserById(id, { ban_duration: status === "locked" ? "876000h" : "none" });
  revalidatePath("/admin/users");
  return { ok: true };
}

/** Admin cấp lại MK cho bất kỳ ai; Đội trưởng cấp lại cho nhân viên trong đội. */
export async function resetPassword(msnv: string, requestId?: number) {
  const me = await requireProfile(["admin", "doi_truong"]);
  const admin = createAdminClient();
  const { data: target } = await admin.from("profiles").select("id, team_lead_id, role").eq("msnv", msnv.toUpperCase()).maybeSingle();
  if (!target) return { error: "Không tìm thấy MSNV" };
  if (me.role === "doi_truong" && target.team_lead_id !== me.id) return { error: "Chỉ cấp lại mật khẩu cho nhân viên trong đội" };
  const password = genPassword();
  const { error } = await admin.auth.admin.updateUserById(target.id, { password });
  if (error) return { error: error.message };
  if (requestId) await admin.from("password_reset_requests").update({ status: "done", handled_by: me.id, handled_at: new Date().toISOString() }).eq("id", requestId);
  revalidatePath("/admin/reset-requests");
  return { ok: true, password };
}

export async function rejectResetRequest(id: number) {
  const me = await requireProfile(["admin", "doi_truong"]);
  const supabase = await createClient();
  await supabase.from("password_reset_requests").update({ status: "rejected", handled_by: me.id, handled_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/reset-requests");
}

export async function saveFrequency(sectionId: number, days: number) {
  await requireProfile(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase.from("maintenance_frequencies").upsert({ section_id: sectionId, interval_days: Math.max(1, Math.round(days)), updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function saveTemplateItem(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireProfile(["admin"]);
  const supabase = await createClient();
  const id = fd.get("id") ? Number(fd.get("id")) : null;
  const text = String(fd.get("text") ?? "").trim();
  if (!text) return { error: "Nhập nội dung tiêu chí" };
  if (id) {
    const { error } = await supabase.from("checklist_items").update({ text, is_active: fd.get("is_active") !== "off" }).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const section_id = Number(fd.get("section_id"));
    const { data: sec } = await supabase.from("checklist_sections").select("form_type").eq("id", section_id).single();
    const prefix = sec?.form_type === "nso" ? "nso" : sec?.form_type === "periodic" ? "per" : "mt";
    const code = `${prefix}_${Date.now().toString(36)}`;
    const { count } = await supabase.from("checklist_items").select("id", { count: "exact", head: true }).eq("section_id", section_id);
    const { error } = await supabase.from("checklist_items").insert({ section_id, code, text, sort: (count ?? 0) + 1 });
    if (error) return { error: error.message };
  }
  revalidatePath("/admin/settings");
  return { ok: "Đã lưu tiêu chí" };
}

export async function changePassword(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireProfile();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next.length < 8) return { error: "Mật khẩu mới tối thiểu 8 ký tự" };
  if (next !== String(fd.get("confirm") ?? "")) return { error: "Xác nhận mật khẩu không khớp" };
  const supabase = await createClient();
  const { error: authErr } = await supabase.auth.signInWithPassword({ email: msnvToEmail(me.msnv), password: current });
  if (authErr) return { error: "Mật khẩu hiện tại không đúng" };
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: error.message };
  return { ok: "Đã đổi mật khẩu" };
}
