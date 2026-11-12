import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderInspectionPdf } from "@/lib/pdf/render";
import { mailConfigured, sendMail, senderAddress } from "@/lib/mailer";
import { FORM_META } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
const isEmail = (v?: string | null): v is string => Boolean(v && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()));

/** Gửi PDF biên bản về email cửa hàng và email nhân viên lập biên bản. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return Response.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  if (!mailConfigured()) return Response.json({ ok: false, error: "Hệ thống chưa cấu hình gửi mail (GMAIL_USER, GMAIL_APP_PASSWORD)" }, { status: 503 });

  const out = await renderInspectionPdf(supabase, id);
  if (!out) return Response.json({ ok: false, error: "Không tìm thấy biên bản" }, { status: 404 });
  const i = out.inspection;

  const admin = createAdminClient();
  const [{ data: store }, { data: inspector }] = await Promise.all([
    admin.from("stores").select("email").eq("id", i.store_id).maybeSingle(),
    admin.from("profiles").select("contact_email").eq("id", i.inspector_id).maybeSingle(),
  ]);
  // Người nhận (To): cửa hàng. Bản sao ẩn (BCC): nhân viên lập biên bản và tài khoản gửi.
  const storeMail = isEmail(store?.email) ? store.email.trim().toLowerCase() : null;
  const bcc = Array.from(new Set([inspector?.contact_email, senderAddress()].filter(isEmail).map((e) => e.trim().toLowerCase()))).filter((e) => e !== storeMail);
  const to = storeMail ? [storeMail] : bcc.slice(0, 1);
  if (!to.length) {
    await admin.from("inspections").update({ email_status: "Không có email người nhận" }).eq("id", id);
    return Response.json({ ok: false, error: "Cửa hàng và nhân viên chưa có email" }, { status: 422 });
  }

  const meta = FORM_META[i.form_type];
  const subject = `[WCM TECHNICAL] ${meta.short} - ${i.store_code} ${i.store_name} - ${i.code}`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
    <p>Kính gửi Quý cửa hàng <b>${esc(i.store_code)} – ${esc(i.store_name)}</b>,</p>
    <p>Bộ phận Kỹ thuật WinCommerce gửi kèm biên bản <b>${esc(meta.title)}</b> số <b>${esc(i.code)}</b>
    ngày ${esc(i.inspection_date)}, do ${esc(i.inspector_name)} (${esc(i.inspector_msnv)}) thực hiện.</p>
    <p>Tỷ lệ đạt: <b>${Number(i.score)}%</b> · Hạng mục lỗi/cần xử lý: <b>${i.fail_items}</b> · Khẩn cấp: <b>${i.urgent_items}</b>.</p>
    <p>Chi tiết xem file PDF đính kèm.</p>
    <p style="color:#888;font-size:12px">Email tự động từ hệ thống WCM TECHNICAL.</p></div>`;

  const r = await sendMail({ to, bcc: storeMail ? bcc : [], subject, html, attachments: [{ filename: `${i.code}_${i.store_code}.pdf`, content: out.buffer }] });
  await admin.from("inspections").update(r.ok ? { emailed_at: new Date().toISOString(), email_status: `Đã gửi: ${to.join(", ")}${storeMail && bcc.length ? ` (BCC: ${bcc.join(", ")})` : ""}` } : { email_status: `Lỗi: ${r.error}` }).eq("id", id);
  if (!r.ok) return Response.json({ ok: false, error: r.error }, { status: 502 });
  return Response.json({ ok: true, to: storeMail ? [...to, ...bcc.map((b) => `${b} (ẩn)`)] : to });
}
