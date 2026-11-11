// Tạo tài khoản Admin đầu tiên.
// Cách dùng: node --env-file=.env.local scripts/create-admin.mjs <MSNV> <MatKhau> "<Họ tên>"
import { createClient } from "@supabase/supabase-js";

const [msnv, password, fullName = "Quản trị hệ thống"] = process.argv.slice(2);
if (!msnv || !password) {
  console.error('Cách dùng: node --env-file=.env.local scripts/create-admin.mjs <MSNV> <MatKhau> "<Họ tên>"');
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
const domain = process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN || "wcm-technical.local";
const code = msnv.trim().toUpperCase();
const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await supabase.auth.admin.createUser({ email: `${code.toLowerCase()}@${domain}`, password, email_confirm: true, user_metadata: { msnv: code } });
if (error) throw error;
const { error: pErr } = await supabase.from("profiles").insert({ id: data.user.id, msnv: code, full_name: fullName, title: "Quản trị hệ thống", role: "admin" });
if (pErr) { await supabase.auth.admin.deleteUser(data.user.id); throw pErr; }
console.log(`✓ Đã tạo Admin ${code}. Đăng nhập bằng MSNV ${code}.`);
