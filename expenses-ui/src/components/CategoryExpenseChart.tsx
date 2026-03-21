import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Card, Title } from "@tremor/react";
import { useIsMobile } from "../hooks/use-mobile";
import type { Expense } from "../lib/types";

interface CategoryExpenseChartProps {
  expenses: Expense[];
  view: "all" | "monthly" | "yearly";
}

interface DataPoint {
  label: string;
  ars: number;
  usd: number;
}

type Currency = "ars" | "usd";

const CURRENCY_CONFIG = {
  ars: {
    color: "#3B82F6",
    gradientId: "catGradArs",
    label: "ARS",
    tickFormatter: (v: number) => v.toLocaleString("es-AR"),
  },
  usd: {
    color: "#10B981",
    gradientId: "catGradUsd",
    label: "USD",
    tickFormatter: (v: number) =>
      v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  },
} as const;

function groupKey(date: Date, view: "all" | "monthly" | "yearly"): string {
  if (view === "monthly") {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatLabel(key: string, view: "all" | "monthly" | "yearly"): string {
  if (view === "monthly") {
    const [, month, day] = key.split("-");
    return `${month}/${day}`;
  }
  const [year, month] = key.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function buildChartData(
  expenses: Expense[],
  view: "all" | "monthly" | "yearly",
): DataPoint[] {
  const map = new Map<string, { ars: number; usd: number }>();

  for (const expense of expenses) {
    const date = new Date(expense.date);
    const key = groupKey(date, view);
    const existing = map.get(key) ?? { ars: 0, usd: 0 };
    map.set(key, {
      ars: existing.ars + (expense.arsAmount ?? 0),
      usd: existing.usd + (expense.usdAmount ?? 0),
    });
  }

  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, { ars, usd }]) => ({
      label: formatLabel(key, view),
      ars: Math.round(ars * 100) / 100,
      usd: Math.round(usd * 100) / 100,
    }));
}

const tooltipStyle = {
  backgroundColor: "rgba(0,0,0,0.85)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "13px",
};

export function CategoryExpenseChart({ expenses, view }: CategoryExpenseChartProps) {
  const isMobile = useIsMobile();

  const hasArs = useMemo(() => expenses.some((e) => (e.arsAmount ?? 0) > 0), [expenses]);
  const hasUsd = useMemo(() => expenses.some((e) => (e.usdAmount ?? 0) > 0), [expenses]);

  const defaultCurrency: Currency = hasUsd ? "usd" : "ars";
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);

  const activeCurrency: Currency = hasArs && hasUsd ? currency : defaultCurrency;

  const data = useMemo(() => buildChartData(expenses, view), [expenses, view]);

  const config = CURRENCY_CONFIG[activeCurrency];

  const average = useMemo(() => {
    if (data.length === 0) return 0;
    const total = data.reduce((sum, d) => sum + d[activeCurrency], 0);
    return Math.round((total / data.length) * 100) / 100;
  }, [data, activeCurrency]);

  const chartMargin = isMobile
    ? { top: 5, right: 10, left: -10, bottom: 5 }
    : { top: 5, right: 30, left: 20, bottom: 5 };

  const groupingLabel = view === "monthly" ? "daily" : "monthly";

  return (
    <Card className="bg-slate-900 border border-slate-800 rounded-lg">
      <div className="flex items-center justify-between">
        <Title>Expense progression ({groupingLabel})</Title>
        {hasArs && hasUsd && (
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
            {(["ars", "usd"] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  activeCurrency === c
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                style={activeCurrency === c ? { backgroundColor: CURRENCY_CONFIG[c].color } : {}}
              >
                {CURRENCY_CONFIG[c].label}
              </button>
            ))}
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No expenses to display
        </div>
      ) : (
        <div className={`mt-6 w-full ${isMobile ? "h-[280px]" : "h-[320px]"}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={chartMargin}>
              <defs>
                <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={config.color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="label"
                stroke="#9CA3AF"
                style={{ fontSize: isMobile ? "10px" : "12px" }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke={config.color}
                style={{ fontSize: isMobile ? "10px" : "12px" }}
                tickFormatter={config.tickFormatter}
                label={
                  isMobile
                    ? undefined
                    : {
                        value: config.label,
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: config.color, fontSize: "12px" },
                      }
                }
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [config.tickFormatter(value), config.label]}
              />
              <Area
                type="monotone"
                dataKey={activeCurrency}
                name={config.label}
                stroke={config.color}
                strokeWidth={2}
                fill={`url(#${config.gradientId})`}
              />
              <ReferenceLine
                y={average}
                stroke="#F59E0B"
                strokeDasharray="5 3"
                strokeWidth={1.5}
                label={{
                  value: `avg ${config.tickFormatter(average)}`,
                  position: "insideTopRight",
                  fill: "#F59E0B",
                  fontSize: 11,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
