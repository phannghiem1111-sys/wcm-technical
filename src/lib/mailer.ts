import "server-only";
import nodemailer from "nodemailer";

type Attachment = { filename: string; content: Buffer };
type Mail = { to: string[]; bcc?: string[]; subject: string; html: string; attachments?: Attachment[] };

const clean = (v?: string) => (v ?? "").trim();

/** Ưu tiên Gmail (GMAIL_USER + GMAIL_APP_PASSWORD); nếu không có thì dùng Resend (RESEND_API_KEY). */
export function mailConfigured() {
  return Boolean((clean(process.env.GMAIL_USER) && clean(process.env.GMAIL_APP_PASSWORD)) || clean(process.env.RESEND_API_KEY));
}
export const senderAddress = () => clean(process.env.GMAIL_USER);

export async function sendMail(opts: Mail) {
  const user = clean(process.env.GMAIL_USER);
  const pass = clean(process.env.GMAIL_APP_PASSWORD).replace(/\s+/g, "");
  if (user && pass) {
    try {
      const t = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
      await t.sendMail({
        from: `"WCM TECHNICAL" <${user}>`,
        to: opts.to,
        bcc: opts.bcc,
        subject: opts.subject,
        html: opts.html,
        attachments: opts.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
      });
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: `Gmail: ${e instanceof Error ? e.message : String(e)}`.slice(0, 250) };
    }
  }

  const key = clean(process.env.RESEND_API_KEY);
  if (!key) return { ok: false as const, error: "Chưa cấu hình gửi mail (GMAIL_USER + GMAIL_APP_PASSWORD)" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: clean(process.env.MAIL_FROM) || "WCM Technical <onboarding@resend.dev>",
      to: opts.to,
      bcc: opts.bcc,
      subject: opts.subject,
      html: opts.html,
      attachments: opts.attachments?.map((a) => ({ filename: a.filename, content: a.content.toString("base64") })),
    }),
  });
  if (!res.ok) return { ok: false as const, error: `Resend ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}` };
  return { ok: true as const };
}
