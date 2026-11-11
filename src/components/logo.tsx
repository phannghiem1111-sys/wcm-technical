import { cn } from "@/lib/utils";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-red-900/30">
        <span className="text-[13px] font-black leading-none tracking-tight">WCM</span>
        <span className="mt-0.5 h-px w-6 bg-white/80" />
      </div>
      <div className="leading-tight">
        <div className={cn("text-base font-black tracking-tight", light ? "text-white" : "text-zinc-900")}>
          WCM <span className="text-primary">TECHNICAL</span>
        </div>
        <div className={cn("text-[9px] font-bold uppercase tracking-[0.12em]", light ? "text-zinc-400" : "text-muted-foreground")}>
          WinCommerce Technical Management
        </div>
      </div>
    </div>
  );
}
