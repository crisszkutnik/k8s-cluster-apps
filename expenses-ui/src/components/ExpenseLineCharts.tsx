import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card, Title } from "@tremor/react";

interface ExpenseLineChartsProps {
  expenses: Array<{
    usdAmount?: number;
    categoryId: string;
    date: string;
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

export function ExpenseLineCharts({
  expenses,
  categories,
}: ExpenseLineChartsProps) {
  // Process data for category line chart
  const categoryLineData = useMemo(() => {
    // Group expenses by month and category
    const monthCategoryMap = new Map<string, Map<string, number>>();

    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const amount = expense.usdAmount || 0;

      if (!monthCategoryMap.has(monthKey)) {
        monthCategoryMap.set(monthKey, new Map());
      }

      const categoryMap = monthCategoryMap.get(monthKey)!;
      const current = categoryMap.get(expense.categoryId) || 0;
      categoryMap.set(expense.categoryId, current + amount);
    });

    // Convert to array format for recharts
    const data = Array.from(monthCategoryMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, categoryMap]) => {
        const dataPoint: Record<string, unknown> = { parsed_date: month };
        categoryMap.forEach((amount, categoryId) => {
          dataPoint[categoryId] = Math.round(amount * 100) / 100;
        });
        return dataPoint;
      });

    return data;
  }, [expenses]);

  // Process data for total expenses area chart
  const totalLineData = useMemo(() => {
    const monthTotalMap = new Map<string, number>();

    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const amount = expense.usdAmount || 0;

      const current = monthTotalMap.get(monthKey) || 0;
      monthTotalMap.set(monthKey, current + amount);
    });

    const data = Array.from(monthTotalMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, total]) => ({
        parsed_date: month,
        total_amount: Math.round(total * 100) / 100,
      }));

    return data;
  }, [expenses]);

  // Get top categories by total amount
  const topCategories = useMemo(() => {
    const categoryTotals = new Map<string, number>();

    expenses.forEach((expense) => {
      const amount = expense.usdAmount || 0;
      const current = categoryTotals.get(expense.categoryId) || 0;
      categoryTotals.set(expense.categoryId, current + amount);
    });

    const sorted = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return sorted.map(([categoryId]) => {
      const category = categories.find((c) => c.id === categoryId);
      return {
        id: categoryId,
        name: category?.name || "Unknown",
      };
    });
  }, [expenses, categories]);

  return (
    <>
      {/* Category Line Chart */}
      <Card className="bg-slate-900 border border-slate-800 rounded-lg">
        <Title>All year expenses by category line chart</Title>
        <div className="mt-6 w-full h-[400px]">
          {categoryLineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={categoryLineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="parsed_date"
                  stroke="#9CA3AF"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: "12px" }}
                  label={{
                    value: "total amount",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#9CA3AF", fontSize: "12px" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: number) => [
                    value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    "",
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                />
                {topCategories.map((category, index) => (
                  <Line
                    key={category.id}
                    type="monotone"
                    dataKey={category.id}
                    name={category.name}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full w-full">
              <p className="text-muted-foreground">No expenses to display</p>
            </div>
          )}
        </div>
      </Card>

      {/* Total Expenses Area Chart */}
      <Card className="bg-slate-900 border border-slate-800 rounded-lg">
        <Title>All year expenses line chart</Title>
        <div className="mt-6 w-full h-[400px]">
          {totalLineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={totalLineData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="parsed_date"
                  stroke="#9CA3AF"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: "12px" }}
                  label={{
                    value: "total amount",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#9CA3AF", fontSize: "12px" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: number) => [
                    value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    "Total",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="total_amount"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full w-full">
              <p className="text-muted-foreground">No expenses to display</p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

