"use client";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Loader2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
export function MaterialFrame({ mien, url, title, msnv, tabs }: { mien: string; url: string; title: string; msnv: string; tabs: ReactNode }) {
  const k = keyOf(mien, msnv);
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  // Toàn màn hình ngay trong app WCM (không bật trình duyệt/tab mới); nút Back của điện thoại cũng thoát được
  const [full, setFull] = useState(false);
  useEffect(() => {
    if (!full) return;
    history.pushState({ vtFull: true }, "");
    const onPop = () => setFull(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") history.back(); };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("popstate", onPop); window.removeEventListener("keydown", onKey); };
  }, [full]);

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
    <div className={cn("flex flex-col bg-white", full ? "fixed inset-0 z-[100] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]" : "-mx-3 -mb-28 -mt-4 h-[calc(100dvh-8.5rem)] sm:-mx-6 lg:-mb-10 lg:-mt-8 lg:h-dvh")}>
      <div className="flex items-center justify-between gap-2 border-b bg-white px-3 py-2 sm:px-6">
        {full ? (
          <Button size="sm" variant="outline" onClick={() => history.back()}><ArrowLeft /> Quay lại WCM</Button>
        ) : (
          <div className="flex gap-1">{tabs}</div>
        )}
        {full ? <span className="truncate text-sm font-bold">{title}</span> : <Button size="sm" variant="outline" onClick={() => setFull(true)}><Maximize2 /> Toàn màn hình</Button>}
      </div>
      {err && <div className="bg-amber-50 px-3 py-1.5 text-xs text-amber-800 sm:px-6">{err}. Đăng nhập bằng MSNV + PIN của app vật tư.</div>}
      {src ? (
        <iframe src={src} title={title} className="w-full flex-1 border-0 bg-white" allow="camera; clipboard-write; geolocation" />
      ) : (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin text-primary" /> Đang đăng nhập app vật tư…</div>
      )}
    </div>
  );
}
