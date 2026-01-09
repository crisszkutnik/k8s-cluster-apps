import { useMemo } from "react";
import { Card, Metric, Flex, Text } from "@tremor/react";
import { useExpenseStore } from "../lib/stores/expenseStore";
import { useCategoryStore } from "../lib/stores/categoryStore";
import { MonthPicker } from "../components/MonthPicker";
import { ExpensePieChart } from "../components/ExpensePieChart";

export function Home() {
  const expenses = useExpenseStore((state) => state.expenses);
  const categories = useCategoryStore((state) => state.categories);
  const currentMonth = useExpenseStore((state) => state.currentMonth);

  // Calculate KPI values
  const arsTotal = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + (expense.arsAmount || 0), 0);
  }, [expenses]);

  const arsMes = useMemo(() => {
    return expenses.reduce((sum, expense) => {
      if (expense.recurrentExpenseId || expense.installementsExpenseId) {
        return sum;
      }

      return sum + (expense.arsAmount || 0);
    }, 0);
  }, [expenses]);

  const arsCuotas = useMemo(() => {
    return expenses.reduce((sum, expense) => {
      if (expense.recurrentExpenseId || !expense.installementsExpenseId) {
        return sum;
      }

      return sum + (expense.arsAmount || 0);
    }, 0);
  }, [expenses]);

  const arsFijos = useMemo(() => {
    return expenses.reduce((sum, expense) => {
      if (!expense.recurrentExpenseId || expense.installementsExpenseId) {
        return sum;
      }

      return sum + (expense.arsAmount || 0);
    }, 0);
  }, [expenses]);

  const usdTotal = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + (expense.usdAmount || 0), 0);
  }, [expenses]);

  const usdMes = useMemo(() => {
    return expenses.reduce((sum, expense) => {
      if (expense.recurrentExpenseId || expense.installementsExpenseId) {
        return sum;
      }

      return sum + (expense.usdAmount || 0);
    }, 0);
  }, [expenses]);

  const usdCuotas = useMemo(() => {
    return expenses.reduce((sum, expense) => {
      if (expense.recurrentExpenseId || !expense.installementsExpenseId) {
        return sum;
      }

      return sum + (expense.usdAmount || 0);
    }, 0);
  }, [expenses]);

  const usdFijos = useMemo(() => {
    return expenses.reduce((sum, expense) => {
      if (!expense.recurrentExpenseId || expense.installementsExpenseId) {
        return sum;
      }

      return sum + (expense.usdAmount || 0);
    }, 0);
  }, [expenses]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header with Month Selector */}
      <Flex justifyContent="between" alignItems="center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your expenses</p>
        </div>
        <MonthPicker currentMonth={currentMonth} />
      </Flex>

      {/* ARS KPI Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">ARS</h2>
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-slate-800 border border-slate-700 rounded-lg">
            <Text className="text-gray-400">ARS total</Text>
            <Metric className="text-white">
              {arsTotal.toLocaleString("es-AR")}
            </Metric>
          </Card>
          <Card className="bg-slate-800 border border-slate-700 rounded-lg">
            <Text className="text-gray-400">ARS Mes</Text>
            <Metric className="text-white">
              {arsMes.toLocaleString("es-AR")}
            </Metric>
          </Card>
          <Card className="bg-slate-800 border border-slate-700 rounded-lg">
            <Text className="text-gray-400">ARS Cuotas</Text>
            <Metric className="text-white">
              {arsCuotas.toLocaleString("es-AR")}
            </Metric>
          </Card>
          <Card className="bg-slate-800 border border-slate-700 rounded-lg">
            <Text className="text-gray-400">ARS Fijos</Text>
            <Metric className="text-white">
              {arsFijos.toLocaleString("es-AR")}
            </Metric>
          </Card>
        </div>
      </div>

      {/* USD KPI Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">USD</h2>
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-slate-800 border border-slate-700 rounded-lg">
            <Text className="text-gray-400">USD Total</Text>
            <Metric className="text-white">
              {parseFloat(usdTotal.toFixed(2)).toLocaleString("en-US")}
            </Metric>
          </Card>
          <Card className="bg-slate-800 border border-slate-700 rounded-lg">
            <Text className="text-gray-400">USD Mes</Text>
            <Metric className="text-white">
              {typeof usdMes === "number"
                ? usdMes.toLocaleString("en-US")
                : parseFloat(usdMes).toLocaleString("en-US")}
            </Metric>
          </Card>
          <Card className="bg-slate-800 border border-slate-700 rounded-lg">
            <Text className="text-gray-400">USD Cuotas</Text>
            <Metric className="text-white">
              {typeof usdCuotas === "number"
                ? usdCuotas.toLocaleString("en-US")
                : parseFloat(usdCuotas).toLocaleString("en-US")}
            </Metric>
          </Card>
          <Card className="bg-slate-800 border border-slate-700 rounded-lg">
            <Text className="text-gray-400">USD Fijos</Text>
            <Metric className="text-white">
              {typeof usdFijos === "number"
                ? usdFijos.toLocaleString("en-US")
                : parseFloat(usdFijos).toLocaleString("en-US")}
            </Metric>
          </Card>
        </div>
      </div>

      {/* Pie Chart */}
      <ExpensePieChart expenses={expenses} categories={categories} />
    </div>
  );
}
