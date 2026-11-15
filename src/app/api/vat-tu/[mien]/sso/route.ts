import { createHmac } from "node:crypto";
import { getProfile } from "@/lib/auth";
import { allowedMaterialApps } from "@/lib/material/access";
import { MATERIAL_APPS, type MaterialAppKey } from "@/lib/material/constants";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Đăng nhập chung: ký {MSNV, vai trò, hạn} rồi đổi lấy token của app vật tư (Apps Script ssoLogin). */
export async function POST(_req: Request, { params }: { params: Promise<{ mien: string }> }) {
  const { mien } = await params;
  if (!(mien in MATERIAL_APPS)) return Response.json({ ok: false, error: "Miền không hợp lệ" }, { status: 404 });
  const key = mien as MaterialAppKey;
  const p = await getProfile();
  if (!p || p.status !== "active") return Response.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  if (!(await allowedMaterialApps(p)).includes(key)) return Response.json({ ok: false, error: "Không có quyền mở app miền này" }, { status: 403 });
  const secret = process.env.MATERIAL_SSO_SECRET?.trim();
  if (!secret) return Response.json({ ok: false, error: "Chưa cấu hình MATERIAL_SSO_SECRET" }, { status: 503 });

  const exp = Date.now() + 5 * 60 * 1000;
  const sig = createHmac("sha256", secret).update(`${p.msnv}|${p.role}|${exp}`).digest("base64url");
  try {
    const res = await fetch(MATERIAL_APPS[key].api, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ fn: "ssoLogin", args: [p.msnv, p.role, exp, sig] }),
      redirect: "follow",
      cache: "no-store",
    });
    const j = (await res.json()) as { ok: boolean; data?: { token: string }; error?: string };
    if (!j.ok || !j.data?.token) return Response.json({ ok: false, error: j.error ?? "App vật tư từ chối đăng nhập" }, { status: 502 });
    return Response.json({ ok: true, token: j.data.token });
  } catch (e) {
    return Response.json({ ok: false, error: "Không kết nối được app vật tư: " + (e instanceof Error ? e.message : "") }, { status: 502 });
  }
}
