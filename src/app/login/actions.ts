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

/** Lần đầu đăng nhập: nhân viên tự đặt mật khẩu (chỉ khi tài khoản còn ở trạng thái "cần đổi mật khẩu"). */
export async function firstLogin(_: FormState, formData: FormData): Promise<FormState> {
  const msnv = String(formData.get("msnv") ?? "").trim().toUpperCase();
  const pw = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!msnv) return { error: "Vui lòng nhập MSNV" };
  if (pw.length < 8) return { error: "Mật khẩu tối thiểu 8 ký tự" };
  if (pw !== confirm) return { error: "Hai mật khẩu không khớp" };
  if (pw === "Wcm@" + msnv) return { error: "Hãy chọn mật khẩu khác mật khẩu mặc định" };
  const problem = envProblem();
  if (problem) return { error: problem };
  const admin = createAdminClient();
  const { data: p } = await admin.from("profiles").select("id,status,must_change_password").eq("msnv", msnv).maybeSingle();
  if (!p || p.status !== "active") return { error: "MSNV không tồn tại hoặc tài khoản bị khóa. Liên hệ quản trị." };
  if (!p.must_change_password) return { error: "Tài khoản này đã đặt mật khẩu. Hãy đăng nhập bằng mật khẩu của bạn, hoặc chọn Quên mật khẩu." };
  const { error: ue } = await admin.auth.admin.updateUserById(p.id, { password: pw });
  if (ue) return { error: "Không đặt được mật khẩu: " + ue.message };
  await admin.from("profiles").update({ must_change_password: false }).eq("id", p.id);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: msnvToEmail(msnv), password: pw });
  if (error) return { error: "Đã đặt mật khẩu, nhưng chưa đăng nhập được. Hãy đăng nhập lại." };
  await logLogin(msnv, p.id, true);
  redirect("/");
}
