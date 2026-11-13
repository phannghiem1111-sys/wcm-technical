import { cn } from "@/lib/utils";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <div className={cn("flex flex-col items-start gap-1", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/wincommerce-logo.png"
        alt="WinCommerce"
        width={459}
        height={118}
        className={cn("h-9 w-auto rounded-lg", light && "bg-white px-2 py-0.5")}
      />
      <div className={cn("text-[10px] font-extrabold uppercase tracking-[0.14em]", light ? "text-zinc-300" : "text-zinc-700")}>
        <span className="text-primary">WCM</span> Technical Management
      </div>
    </div>
  );
}
