import "server-only";

type Attachment = { filename: string; content: Buffer };

/** Gửi mail qua Resend (https://resend.com). Cần biến môi trường RESEND_API_KEY và (tuỳ chọn) MAIL_FROM. */
export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendMail(opts: { to: string[]; subject: string; html: string; attachments?: Attachment[] }) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { ok: false as const, error: "Chưa cấu hình RESEND_API_KEY" };
  const from = process.env.MAIL_FROM?.trim() || "WCM Technical <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      attachments: opts.attachments?.map((a) => ({ filename: a.filename, content: a.content.toString("base64") })),
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    return { ok: false as const, error: `Resend ${res.status}: ${t.slice(0, 200)}` };
  }
  return { ok: true as const };
}
