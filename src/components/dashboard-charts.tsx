"use client";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Pie, PieChart, type PieLabelRenderProps } from "recharts";
import { RESULT_LABEL, type ItemResult } from "@/lib/constants";
import { TYPE_HEX } from "@/lib/dashboard-palette";

type Month = { month: string; nso: number; periodic: number; maintenance: number; avg_score: number };
type StackKey = "nso" | "periodic" | "maintenance";

const STACK: { key: StackKey; name: string; color: string }[] = [
  { key: "nso", name: "NSO", color: TYPE_HEX.nso },
  { key: "periodic", name: "Định kỳ", color: TYPE_HEX.periodic },
  { key: "maintenance", name: "Bảo trì", color: TYPE_HEX.maintenance },
];

const AXIS = { fontSize: 11, fill: "#8a909c" };
const TOOLTIP = { borderRadius: 10, fontSize: 12, border: "1px solid #e6e8ec", boxShadow: "0 4px 16px rgba(16,24,40,.08)" };

// Điền đủ các tháng trong khoảng đang xem để cột không bị kéo giãn hết chiều ngang.
function fillMonths(data: Month[], months: number): Month[] {
  const map = new Map(data.map((d) => [d.month, d]));
  const now = new Date();
  const out: Month[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push(map.get(key) ?? { month: key, nso: 0, periodic: 0, maintenance: 0, avg_score: 0 });
  }
  // Giữ lại tháng có dữ liệu nằm ngoài khoảng (nếu có), theo thứ tự thời gian.
  for (const d of data) if (!out.some((o) => o.month === d.month)) out.push(d);
  return out.sort((a, b) => a.month.localeCompare(b.month));
}

export function MonthlyChart({ data, months = 6 }: { data: Month[]; months?: number }) {
  if (!data.length) return <Empty />;
  const rows = fillMonths(data, Math.max(months, 3)).map((d) => ({ ...d, total: d.nso + d.periodic + d.maintenance, label: `T${d.month.slice(5)}/${d.month.slice(2, 4)}` }));
  return (
    <div>
      <LegendRow items={STACK.map((k) => ({ name: k.name, color: k.color }))} />
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={rows} margin={{ top: 22, right: 4, left: -22, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="#eef0f3" />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: "#e6e8ec" }} />
          <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: "#f3f4f6" }} contentStyle={TOOLTIP} />
          {STACK.map((k, i) => (
            <Bar key={k.key} dataKey={k.key} name={k.name} stackId="a" fill={k.color} maxBarSize={44} isAnimationActive={false} radius={i === STACK.length - 1 ? [5, 5, 0, 0] : undefined}>
              <LabelList dataKey={(r: { label: string } & Record<StackKey, number>) => `${r[k.key]}|${r.label}`} content={segmentLabel(k.key, rows)} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Số trong từng phần cột (ẩn khi = 0 hoặc quá mỏng) + tổng trên đỉnh phần cao nhất khác 0.
function segmentLabel(key: StackKey, rows: (Month & { total: number; label: string })[]) {
  return function SegmentLabel(p: { x?: unknown; y?: unknown; width?: unknown; height?: unknown; value?: unknown; index?: number }) {
    // Recharts đánh index theo nhãn khác 0, nên tra hàng theo nhãn tháng gửi kèm trong value.
    const [vs, lbl] = String(p.value ?? "").split("|");
    const v = Number(vs), x = Number(p.x), y = Number(p.y), w = Number(p.width), h = Number(p.height);
    const row = rows.find((r) => r.label === lbl);
    if (!v || !row) return null;
    const topKey = [...STACK].reverse().find((k) => row[k.key] > 0)?.key;
    return (
      <g>
        {h >= 14 && (
          <text x={x + w / 2} y={y + h / 2} fill="#fff" fontSize={11} fontWeight={600} textAnchor="middle" dominantBaseline="central">{v}</text>
        )}
        {key === topKey && (
          <text x={x + w / 2} y={y - 7} fill="#1f2937" fontSize={12} fontWeight={700} textAnchor="middle">{row.total}</text>
        )}
      </g>
    );
  };
}

const RESULT_COLOR: Partial<Record<ItemResult, string>> = { fail: "#d64545", urgent: "#8b5cf6", monitor: "#e0a23b", maintenance: "#3b82c4", broken: "#7a2e2e" };

export function ResultPie({ data }: { data: Record<string, number> }) {
  const rows = Object.entries(data)
    .map(([k, v]) => ({ name: RESULT_LABEL[k as ItemResult] ?? k, value: Number(v), fill: RESULT_COLOR[k as ItemResult] ?? "#9ca3af" }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
  if (!rows.length) return <Empty />;
  const total = rows.reduce((a, r) => a + r.value, 0);
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  const label = ({ cx, cy, midAngle, innerRadius, outerRadius, value, percent }: PieLabelRenderProps) => {
    const v = Number(value);
    if (!v || Number(percent) < 0.08) return null;
    const r = (Number(innerRadius) + Number(outerRadius)) / 2;
    const a = (-Number(midAngle) * Math.PI) / 180;
    return (
      <text x={Number(cx) + r * Math.cos(a)} y={Number(cy) + r * Math.sin(a)} fill="#fff" fontSize={11} fontWeight={700} textAnchor="middle" dominantBaseline="central">{v} ({pct(v)}%)</text>
    );
  };
  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" dy={-7} fontSize={24} fontWeight={800} fill="#1f2937">{total}</text>
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" dy={15} fontSize={11} fill="#8a909c">lỗi</text>
          <Pie data={rows} dataKey="value" nameKey="name" innerRadius={54} outerRadius={86} paddingAngle={rows.length > 1 ? 2 : 0} cornerRadius={4} stroke="none" label={label} labelLine={false} isAnimationActive={false}>
            {rows.map((r) => <Cell key={r.name} fill={r.fill} />)}
          </Pie>
          <Tooltip contentStyle={TOOLTIP} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="space-y-1.5 text-sm">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: r.fill }} />
            <span className="flex-1 truncate text-muted-foreground">{r.name}</span>
            <span className="font-semibold tabular-nums">{r.value}</span>
            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{pct(r.value)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegendRow({ items }: { items: { name: string; color: string }[] }) {
  return (
    <div className="mb-2 flex flex-wrap justify-end gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.name} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: i.color }} />{i.name}</span>
      ))}
    </div>
  );
}

function Empty() {
  return <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">Chưa có dữ liệu</div>;
}
