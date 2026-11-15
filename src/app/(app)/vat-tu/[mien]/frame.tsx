"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/** Token app vật tư sống 12 giờ: giữ trên máy 11 giờ để lần sau mở ngay, không phải chờ đăng nhập lại qua máy chủ. */
const TOKEN_TTL = 11 * 3600 * 1000;
const keyOf = (mien: string, msnv: string) => `wcm_vt_sso_${mien}_${msnv}`;

function readToken(k: string): string | null {
  try {
    const v = JSON.parse(localStorage.getItem(k) ?? "null") as { token: string; exp: number } | null;
    return v && v.exp > Date.now() ? v.token : null;
  } catch {
    return null;
  }
}
function saveToken(k: string, token: string | null) {
  try {
    if (token) localStorage.setItem(k, JSON.stringify({ token, exp: Date.now() + TOKEN_TTL }));
    else localStorage.removeItem(k);
  } catch {}
}

/** Lấy token đăng nhập chung rồi mở app vật tư; lỗi thì mở app bình thường (đăng nhập PIN). */
export function MaterialFrame({ mien, url, title, msnv }: { mien: string; url: string; title: string; msnv: string }) {
  const k = keyOf(mien, msnv);
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    let off = false;
    const open = (token: string) => setSrc(`${url}#sso=${token}&ma=${encodeURIComponent(msnv)}&r=${round}`);
    const cached = round === 0 ? readToken(k) : null;
    if (cached) {
      open(cached);
      return;
    }
    fetch(`/api/vat-tu/${mien}/sso`, { method: "POST" })
      .then((r) => r.json())
      .then((r: { ok: boolean; token?: string; error?: string }) => {
        if (off) return;
        if (r.ok && r.token) { saveToken(k, r.token); setErr(null); open(r.token); }
        else { setErr(r.error ?? "Không đăng nhập tự động được"); setSrc(url); }
      })
      .catch(() => { if (!off) { setErr("Không đăng nhập tự động được"); setSrc(url); } });
    return () => { off = true; };
  }, [mien, url, msnv, k, round]);

  // App vật tư báo token hết hạn → xin token mới (tối đa 1 lần mỗi lần mở trang)
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!url.startsWith(e.origin) || (e.data as { type?: string } | null)?.type !== "bbvt:expired") return;
      saveToken(k, null);
      setRound((n) => (n === 0 ? 1 : n));
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [k, url]);

  return (
    <>
      {err && <div className="bg-amber-50 px-3 py-1.5 text-xs text-amber-800 sm:px-6">{err}. Đăng nhập bằng MSNV + PIN của app vật tư.</div>}
      {src ? (
        <iframe src={src} title={title} className="w-full flex-1 border-0 bg-white" allow="camera; clipboard-write; geolocation" />
      ) : (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin text-primary" /> Đang đăng nhập app vật tư…</div>
      )}
    </>
  );
}
