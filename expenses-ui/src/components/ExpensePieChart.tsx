import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, Title } from "@tremor/react";

interface ExpensePieChartProps {
  expenses: Array<{
    arsAmount?: number;
    categoryId: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
  }>;
}

const COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
  "#14B8A6", // teal
  "#6366F1", // indigo
];

export function ExpensePieChart({
  expenses,
  categories,
}: ExpensePieChartProps) {
  const chartData = useMemo(() => {
    const categoryMap = new Map<string, number>();

    expenses.forEach((expense) => {
      const amount = expense.arsAmount || 0;
      const current = categoryMap.get(expense.categoryId) || 0;
      categoryMap.set(expense.categoryId, current + amount);
    });

    const total = Array.from(categoryMap.values()).reduce(
      (sum, val) => sum + val,
      0
    );

    const data = Array.from(categoryMap.entries()).map(
      ([categoryId, value]) => {
        const category = categories.find((c) => c.id === categoryId);
        const percentage =
          total > 0 ? ((value / total) * 100).toFixed(2) : "0.00";
        return {
          name: category?.name || "Unknown",
          value: Math.round(value * 100) / 100,
          percentage: parseFloat(percentage),
        };
      }
    );

    return data.sort((a, b) => b.percentage - a.percentage);
  }, [expenses, categories]);

  const total = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  const renderCenterLabel = (props: Record<string, unknown>) => {
    const viewBox = props.viewBox as { cx?: number; cy?: number } | undefined;
    const { cx, cy } = viewBox || {};
    if (!cx || !cy) return null;
    return (
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="28"
        fontWeight="bold"
        fill="white"
      >
        {total.toLocaleString("es-AR")}
      </text>
    );
  };

  const renderLegend = () => {
    return (
      <ul className="space-y-2">
        {chartData.map((item, index) => (
          <li key={item.name} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-white">
              {item.name} {item.percentage.toFixed(2)}%
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card className="bg-slate-900 border border-slate-800 rounded-lg">
      <Title>Monthly expenses pie chart</Title>
      <div className="mt-6 w-full h-[500px] flex items-center">
        {chartData.length > 0 ? (
          <>
            <div className="w-1/4">{renderLegend()}</div>
            <div className="w-3/4 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCenterLabel}
                    innerRadius={100}
                    outerRadius={160}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _, props) => {
                      const percentage = props.payload.percentage || 0;
                      return [`${value.toFixed(2)} (${percentage}%)`, "Amount"];
                    }}
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            <p className="text-muted-foreground">No expenses to display</p>
          </div>
        )}
      </div>
    </Card>
  );
}
