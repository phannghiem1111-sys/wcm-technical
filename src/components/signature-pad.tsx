"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Eraser } from "lucide-react";

export type SignatureHandle = { isEmpty: () => boolean; toBlob: () => Promise<Blob | null>; clear: () => void };

/** Khung ký tên bằng ngón tay / bút cảm ứng. */
export const SignaturePad = forwardRef<SignatureHandle, { label: string }>(function SignaturePad({ label }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const c = canvasRef.current!;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const { width, height } = c.getBoundingClientRect();
      c.width = width * ratio; c.height = height * ratio;
      const ctx = c.getContext("2d")!;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#0f172a";
      setEmpty(true);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const pos = (e: React.PointerEvent) => { const r = canvasRef.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  useImperativeHandle(ref, () => ({
    isEmpty: () => empty,
    clear: () => { const c = canvasRef.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); setEmpty(true); },
    toBlob: () => new Promise((res) => (empty ? res(null) : canvasRef.current!.toBlob((b) => res(b), "image/png"))),
  }), [empty]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        <button type="button" className="flex items-center gap-1 text-xs font-semibold text-muted-foreground" onClick={() => { const c = canvasRef.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); setEmpty(true); }}>
          <Eraser className="size-3.5" /> Ký lại
        </button>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="h-40 w-full touch-none rounded-xl border-2 border-dashed border-zinc-300 bg-white"
          onPointerDown={(e) => { drawing.current = true; e.currentTarget.setPointerCapture(e.pointerId); const ctx = e.currentTarget.getContext("2d")!; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }}
          onPointerMove={(e) => { if (!drawing.current) return; const ctx = e.currentTarget.getContext("2d")!; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); if (empty) setEmpty(false); }}
          onPointerUp={() => { drawing.current = false; }}
          onPointerCancel={() => { drawing.current = false; }}
        />
        {empty && <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-zinc-400">Ký tên tại đây</span>}
      </div>
    </div>
  );
});
