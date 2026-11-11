"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { msnvToEmail } from "@/lib/constants";
import { envProblem } from "@/lib/supabase/env";

export type FormState = { error?: string; ok?: string } | undefined;

async function logLogin(msnv: string, userId: string | null, success: boolean) {
  try {
    const h = await headers();
    await createAdminClient().from("login_logs").insert({
      msnv,
      user_id: userId,
      success,
      user_agent: h.get("user-agent")?.slice(0, 300) ?? null,
      ip: (h.get("x-forwarded-for") ?? "").split(",")[0] || null,
    });
  } catch {
    /* không chặn đăng nhập nếu ghi log lỗi */
  }
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const msnv = String(formData.get("msnv") ?? "").trim().toUpperCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");
  if (!msnv || !password) return { error: "Vui lòng nhập MSNV và mật khẩu" };

  const problem = envProblem();
  if (problem) return { error: problem };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: msnvToEmail(msnv), password });
  if (error || !data.user) {
    await logLogin(msnv, null, false);
    if (error && error.status !== 400) {
      console.error("signInWithPassword", error.status, error.name, error.message);
      return { error: `Lỗi kết nối máy chủ xác thực (${error.status ?? error.name}): ${error.message}` };
    }
    return { error: "MSNV hoặc mật khẩu không đúng" };
  }
  const { data: profile } = await supabase.from("profiles").select("status").eq("id", data.user.id).single();
  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    await logLogin(msnv, data.user.id, false);
    return { error: "Tài khoản đã bị khóa hoặc chưa được kích hoạt. Liên hệ quản trị." };
  }
  await logLogin(msnv, data.user.id, true);
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestReset(_: FormState, formData: FormData): Promise<FormState> {
  const msnv = String(formData.get("msnv") ?? "").trim().toUpperCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  if (!msnv) return { error: "Vui lòng nhập MSNV" };
  const admin = createAdminClient();
  const { count } = await admin
    .from("password_reset_requests")
    .select("id", { count: "exact", head: true })
    .eq("msnv", msnv)
    .eq("status", "pending");
  if (!count) await admin.from("password_reset_requests").insert({ msnv, phone, note });
  return { ok: "Đã gửi yêu cầu. Đội trưởng/Quản trị sẽ cấp lại mật khẩu và liên hệ bạn." };
}
