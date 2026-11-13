import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderMaterialPdf } from "@/lib/pdf/render-material";
import { mailConfigured, sendMail, senderAddress } from "@/lib/mailer";

export const runtime = "nodejs";
export const maxDuration = 60;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
const isEmail = (v?: string | null): v is string => Boolean(v && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()));
const split = (v?: string | null) => (v ?? "").split(/[,;\s]+/).map((x) => x.trim().toLowerCase()).filter(isEmail);

/** Gửi PDF biên bản vật tư tới email cửa hàng + email nhập tay; BCC người lập. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return Response.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  if (!mailConfigured()) return Response.json({ ok: false, error: "Hệ thống chưa cấu hình gửi mail (GMAIL_USER, GMAIL_APP_PASSWORD)" }, { status: 503 });

  const out = await renderMaterialPdf(supabase, id);
  if (!out) return Response.json({ ok: false, error: "Không tìm thấy biên bản" }, { status: 404 });
  const r = out.report;

  const admin = createAdminClient();
  const { data: reporter } = await admin.from("profiles").select("contact_email").eq("id", r.reporter_id).maybeSingle();
  const toList = Array.from(new Set([...split(r.store_email), ...split(r.email_to)]));
  const bccAll = Array.from(new Set([reporter?.contact_email, senderAddress()].filter(isEmail).map((e) => e.trim().toLowerCase())));
  const to = toList.length ? toList : bccAll.slice(0, 1);
  const bcc = bccAll.filter((e) => !to.includes(e));
  if (!to.length) {
    await admin.from("material_reports").update({ email_status: "Không có email người nhận" }).eq("id", id);
    return Response.json({ ok: false, error: "Cửa hàng và người lập chưa có email" }, { status: 422 });
  }

  const subject = `[WCM TECHNICAL] Biên bản vật tư - ${r.store_code} ${r.store_name} - ${r.code}`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
    <p>Kính gửi Quý cửa hàng <b>${esc(r.store_code)} – ${esc(r.store_name)}</b>,</p>
    <p>Bộ phận Kỹ thuật WinCommerce gửi kèm <b>Biên bản vật tư</b> số <b>${esc(r.code)}</b>, V/v: ${esc(r.subject ?? "")},
    do ${esc(r.reporter_name)} (${esc(r.reporter_msnv)}) lập.</p>
    <p>Hạng mục: <b>${esc(r.category === "Khác" ? r.category_other ?? "Khác" : r.category)}</b> · Đề xuất: <b>${esc(r.proposal)}</b>.</p>
    <p>Chi tiết xem file PDF đính kèm.</p>
    <p style="color:#888;font-size:12px">Email tự động từ hệ thống WCM TECHNICAL.</p></div>`;

  const res = await sendMail({ to, bcc, subject, html, attachments: [{ filename: `${r.code}_${r.store_code}.pdf`, content: out.buffer }] });
  await admin.from("material_reports").update(res.ok ? { emailed_at: new Date().toISOString(), email_status: `Đã gửi: ${to.join(", ")}${bcc.length ? ` (BCC: ${bcc.join(", ")})` : ""}` } : { email_status: `Lỗi: ${res.error}` }).eq("id", id);
  if (!res.ok) return Response.json({ ok: false, error: res.error }, { status: 502 });
  return Response.json({ ok: true, to: [...to, ...bcc.map((b) => `${b} (ẩn)`)] });
}
