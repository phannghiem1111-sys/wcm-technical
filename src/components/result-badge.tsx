import { Badge } from "@/components/ui/badge";
import { RESULT_LABEL, STATUS_LABEL, type ItemResult } from "@/lib/constants";

const VARIANT: Record<ItemResult, "success" | "danger" | "warning" | "secondary" | "info"> = {
  pass: "success", good: "success", fail: "danger", broken: "danger", urgent: "danger", monitor: "warning", maintenance: "warning", na: "secondary",
};

export function ResultBadge({ result }: { result: ItemResult | null }) {
  if (!result) return <Badge variant="outline">—</Badge>;
  return <Badge variant={VARIANT[result]}>{RESULT_LABEL[result]}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const v = status === "approved" ? "success" : status === "rejected" ? "danger" : status === "submitted" ? "warning" : "secondary";
  return <Badge variant={v}>{STATUS_LABEL[status] ?? status}</Badge>;
}

export function ScoreBadge({ score }: { score: number }) {
  const s = Number(score);
  const v = s >= 90 ? "success" : s >= 70 ? "warning" : "danger";
  return <Badge variant={v} className="text-sm">{s.toFixed(0)}%</Badge>;
}
