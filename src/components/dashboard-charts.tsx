"use client";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Pie, PieChart } from "recharts";
import { RESULT_LABEL, type ItemResult } from "@/lib/constants";

type Month = { month: string; nso: number; periodic: number; maintenance: number; avg_score: number };

export function MonthlyChart({ data }: { data: Month[] }) {
  const rows = data.map((d) => ({ ...d, label: `T${d.month.slice(5)}/${d.month.slice(2, 4)}` }));
  if (!rows.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={rows} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="nso" name="NSO" stackId="a" fill="#d9232d" />
        <Bar dataKey="periodic" name="Định kỳ" stackId="a" fill="#2563eb" />
        <Bar dataKey="maintenance" name="Bảo trì" stackId="a" fill="#d97706" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const RESULT_COLOR: Partial<Record<ItemResult, string>> = { fail: "#dc2626", urgent: "#a21caf", monitor: "#f59e0b", maintenance: "#fb923c", broken: "#7f1d1d" };

export function ResultPie({ data }: { data: Record<string, number> }) {
  const rows = Object.entries(data).map(([k, v]) => ({ name: RESULT_LABEL[k as ItemResult] ?? k, value: v, fill: RESULT_COLOR[k as ItemResult] ?? "#9ca3af" }));
  if (!rows.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {rows.map((r) => <Cell key={r.name} fill={r.fill} />)}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">Chưa có dữ liệu</div>;
}
