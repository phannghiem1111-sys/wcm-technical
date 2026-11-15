"use client";
import { Bar, BarChart, CartesianGrid, Legend, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Pie, PieChart, type PieLabelRenderProps } from "recharts";
import { RESULT_LABEL, type ItemResult } from "@/lib/constants";

type Month = { month: string; nso: number; periodic: number; maintenance: number; avg_score: number };

export function MonthlyChart({ data }: { data: Month[] }) {
  const rows = data.map((d) => ({ ...d, total: d.nso + d.periodic + d.maintenance, label: `T${d.month.slice(5)}/${d.month.slice(2, 4)}` }));
  if (!rows.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={rows} margin={{ top: 22, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {STACK.map((k, i) => (
          <Bar key={k.key} dataKey={k.key} name={k.name} stackId="a" fill={k.color} radius={i === STACK.length - 1 ? [6, 6, 0, 0] : undefined}>
            <LabelList dataKey={k.key} content={segmentLabel(k.key, rows)} />
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

type StackKey = "nso" | "periodic" | "maintenance";
const STACK: { key: StackKey; name: string; color: string }[] = [
  { key: "nso", name: "NSO", color: "#d9232d" },
  { key: "periodic", name: "Định kỳ", color: "#2563eb" },
  { key: "maintenance", name: "Bảo trì", color: "#d97706" },
];

// Số trong từng phần cột (ẩn khi = 0 hoặc quá mỏng) + tổng trên đỉnh phần cao nhất khác 0.
function segmentLabel(key: StackKey, rows: (Month & { total: number })[]) {
  return function SegmentLabel(p: { x?: unknown; y?: unknown; width?: unknown; height?: unknown; value?: unknown; index?: number }) {
    const v = Number(p.value), x = Number(p.x), y = Number(p.y), w = Number(p.width), h = Number(p.height);
    const row = rows[p.index ?? -1];
    if (!v || !row) return null;
    const topKey = [...STACK].reverse().find((k) => row[k.key] > 0)?.key;
    return (
      <g>
        {h >= 14 && (
          <text x={x + w / 2} y={y + h / 2} fill="#fff" fontSize={11} fontWeight={700} textAnchor="middle" dominantBaseline="central">{v}</text>
        )}
        {key === topKey && (
          <text x={x + w / 2} y={y - 6} fill="#111827" fontSize={12} fontWeight={700} textAnchor="middle">{row.total}</text>
        )}
      </g>
    );
  };
}

const RESULT_COLOR: Partial<Record<ItemResult, string>> = { fail: "#dc2626", urgent: "#a21caf", monitor: "#f59e0b", maintenance: "#fb923c", broken: "#7f1d1d" };

export function ResultPie({ data }: { data: Record<string, number> }) {
  const rows = Object.entries(data).map(([k, v]) => ({ name: RESULT_LABEL[k as ItemResult] ?? k, value: v, fill: RESULT_COLOR[k as ItemResult] ?? "#9ca3af" }));
  if (!rows.length) return <Empty />;
  const total = rows.reduce((a, r) => a + r.value, 0);
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  const label = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: PieLabelRenderProps) => {
    const v = Number(value);
    if (!v) return null;
    const r = (Number(innerRadius) + Number(outerRadius)) / 2;
    const a = (-Number(midAngle) * Math.PI) / 180;
    return (
      <text x={Number(cx) + r * Math.cos(a)} y={Number(cy) + r * Math.sin(a)} fill="#fff" fontSize={11} fontWeight={700} textAnchor="middle" dominantBaseline="central">
        {v} ({pct(v)}%)
      </text>
    );
  };
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <text x="50%" y="44%" textAnchor="middle" dominantBaseline="central" fontSize={22} fontWeight={800} fill="#111827">{total}</text>
        <text x="50%" y="44%" dy={20} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="#6b7280">lỗi</text>
        <Pie data={rows} dataKey="value" nameKey="name" cy="44%" innerRadius={55} outerRadius={90} paddingAngle={2} label={label} labelLine={false} isAnimationActive={false}>
          {rows.map((r) => <Cell key={r.name} fill={r.fill} />)}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} formatter={(name, entry) => { const v = Number((entry.payload as { value?: number })?.value ?? 0); return `${name}: ${v} (${pct(v)}%)`; }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">Chưa có dữ liệu</div>;
}
