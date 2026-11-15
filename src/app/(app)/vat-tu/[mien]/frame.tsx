"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/** Lấy token đăng nhập chung rồi mở app vật tư; lỗi thì mở app bình thường (đăng nhập PIN). */
export function MaterialFrame({ mien, url, title }: { mien: string; url: string; title: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let off = false;
    fetch(`/api/vat-tu/${mien}/sso`, { method: "POST" })
      .then((r) => r.json())
      .then((r: { ok: boolean; token?: string; error?: string }) => {
        if (off) return;
        if (r.ok && r.token) setSrc(`${url}#sso=${r.token}`);
        else { setErr(r.error ?? "Không đăng nhập tự động được"); setSrc(url); }
      })
      .catch(() => { if (!off) { setErr("Không đăng nhập tự động được"); setSrc(url); } });
    return () => { off = true; };
  }, [mien, url]);

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
