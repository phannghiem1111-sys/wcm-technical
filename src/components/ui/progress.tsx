import { cn } from "@/lib/utils";

function Progress({ value = 0, className, indicatorClassName, indicatorStyle }: { value?: number; className?: string; indicatorClassName?: string; indicatorStyle?: React.CSSProperties }) {
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full bg-primary transition-all", indicatorClassName)} style={{ ...indicatorStyle, width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
export { Progress };
