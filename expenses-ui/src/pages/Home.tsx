import { useMemo } from "react";
import { Card, Metric, Text } from "@tremor/react";
import { useExpenseStore } from "../lib/stores/expenseStore";
import { useCategoryStore } from "../lib/stores/categoryStore";
import { usePaymentMethodStore } from "../lib/stores/paymentMethodStore";
import { MonthPicker } from "../components/MonthPicker";
import { YearPicker } from "../components/YearPicker";
import { ExpensePieChart } from "../components/ExpensePieChart";
import { ExpenseLineCharts } from "../components/ExpenseLineCharts";
import { ExpenseTables } from "../components/ExpenseTables";
import { categorizeExpenses } from "../lib/utils";
import { useRouter } from "@tanstack/react-router";
import { useIsMobile } from "../hooks/use-mobile";

export function Home() {
  const router = useRouter();
  const expenses = useExpenseStore((state) => state.expenses);
  const categories = useCategoryStore((state) => state.categories);
  const paymentMethods = usePaymentMethodStore((state) => state.paymentMethods);
  const currentMonth = useExpenseStore((state) => state.currentMonth);
  const currentYear = useExpenseStore((state) => state.currentYear);
  const view = useExpenseStore((state) => state.view);
  const isMobile = useIsMobile();

  // Categorize expenses using utility function
  const { monthly, installments, recurrent } = useMemo(
    () => categorizeExpenses(expenses),
    [expenses]
  );

  // Handle view toggle
  const handleViewChange = (newView: "monthly" | "yearly") => {
    if (newView === "monthly") {
      const month =
        currentMonth ||
        new Date().toLocaleDateString("en-CA", {
          year: "numeric",
          month: "2-digit",
        });
      void router.navigate({
        to: "/",
        search: { month, view: "monthly" },
        replace: true,
      });
    } else {
      const year = currentYear
        ? parseInt(currentYear)
        : new Date().getFullYear();
      void router.navigate({
        to: "/",
        search: { year, view: "yearly" },
        replace: true,
      });
    }
  };

  // Calculate KPI values using categorized expenses
  const arsTotal = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + (expense.arsAmount || 0), 0);
  }, [expenses]);

  const arsMes = useMemo(() => {
    return monthly.reduce((sum, expense) => sum + (expense.arsAmount || 0), 0);
  }, [monthly]);

  const arsCuotas = useMemo(() => {
    return installments.reduce(
      (sum, expense) => sum + (expense.arsAmount || 0),
      0
    );
  }, [installments]);

  const arsFijos = useMemo(() => {
    return recurrent.reduce(
      (sum, expense) => sum + (expense.arsAmount || 0),
      0
    );
  }, [recurrent]);

  const usdTotal = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + (expense.usdAmount || 0), 0);
  }, [expenses]);

  const usdMes = useMemo(() => {
    return monthly.reduce((sum, expense) => sum + (expense.usdAmount || 0), 0);
  }, [monthly]);

  const usdCuotas = useMemo(() => {
    return installments.reduce(
      (sum, expense) => sum + (expense.usdAmount || 0),
      0
    );
  }, [installments]);

  const usdFijos = useMemo(() => {
    return recurrent.reduce(
      (sum, expense) => sum + (expense.usdAmount || 0),
      0
    );
  }, [recurrent]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header with View Switcher and Period Selector */}
      <div className={`flex ${isMobile ? "flex-col gap-4" : "justify-between items-center"}`}>
        <div>
          <h1 className={`font-bold ${isMobile ? "text-2xl" : "text-3xl"}`}>Dashboard</h1>
          <p className="text-muted-foreground">Overview of your expenses</p>
        </div>
        <div className={`flex gap-4 ${isMobile ? "flex-col w-full" : "items-center"}`}>
          {/* View Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1">
            <button
              onClick={() => handleViewChange("monthly")}
              className={`${isMobile ? "flex-1" : ""} px-4 py-2 rounded text-sm font-medium transition-colors ${
                view === "monthly"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Monthly analysis
            </button>
            <button
              onClick={() => handleViewChange("yearly")}
              className={`${isMobile ? "flex-1" : ""} px-4 py-2 rounded text-sm font-medium transition-colors ${
                view === "yearly"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Yearly analysis
            </button>
          </div>

          {/* Period Selector */}
          {view === "monthly" ? (
            <MonthPicker currentMonth={currentMonth} />
          ) : (
            <YearPicker currentYear={currentYear} />
          )}
        </div>
      </div>

      {/* ARS KPI Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">ARS</h2>
        <div className={isMobile ? "overflow-x-auto -mx-4 px-4" : ""}>
          <div className={`${isMobile ? "flex gap-4 min-w-max" : "grid grid-cols-4 gap-4"}`}>
            <Card className={`bg-slate-800 border border-slate-700 rounded-lg ${isMobile ? "min-w-[200px]" : ""}`}>
              <Text className="text-gray-400">ARS total</Text>
              <Metric className="text-white">
                {arsTotal.toLocaleString("es-AR")}
              </Metric>
            </Card>
            <Card className={`bg-slate-800 border border-slate-700 rounded-lg ${isMobile ? "min-w-[200px]" : ""}`}>
              <Text className="text-gray-400">ARS Mes</Text>
              <Metric className="text-white">
                {arsMes.toLocaleString("es-AR")}
              </Metric>
            </Card>
            <Card className={`bg-slate-800 border border-slate-700 rounded-lg ${isMobile ? "min-w-[200px]" : ""}`}>
              <Text className="text-gray-400">ARS Cuotas</Text>
              <Metric className="text-white">
                {arsCuotas.toLocaleString("es-AR")}
              </Metric>
            </Card>
            <Card className={`bg-slate-800 border border-slate-700 rounded-lg ${isMobile ? "min-w-[200px]" : ""}`}>
              <Text className="text-gray-400">ARS Fijos</Text>
              <Metric className="text-white">
                {arsFijos.toLocaleString("es-AR")}
              </Metric>
            </Card>
          </div>
        </div>
      </div>

      {/* USD KPI Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">USD</h2>
        <div className={isMobile ? "overflow-x-auto -mx-4 px-4" : ""}>
          <div className={`${isMobile ? "flex gap-4 min-w-max" : "grid grid-cols-4 gap-4"}`}>
            <Card className={`bg-slate-800 border border-slate-700 rounded-lg ${isMobile ? "min-w-[200px]" : ""}`}>
              <Text className="text-gray-400">USD Total</Text>
              <Metric className="text-white">
                {parseFloat(usdTotal.toFixed(2)).toLocaleString("en-US")}
              </Metric>
            </Card>
            <Card className={`bg-slate-800 border border-slate-700 rounded-lg ${isMobile ? "min-w-[200px]" : ""}`}>
              <Text className="text-gray-400">USD Mes</Text>
              <Metric className="text-white">
                {typeof usdMes === "number"
                  ? usdMes.toLocaleString("en-US")
                  : parseFloat(usdMes).toLocaleString("en-US")}
              </Metric>
            </Card>
            <Card className={`bg-slate-800 border border-slate-700 rounded-lg ${isMobile ? "min-w-[200px]" : ""}`}>
              <Text className="text-gray-400">USD Cuotas</Text>
              <Metric className="text-white">
                {typeof usdCuotas === "number"
                  ? usdCuotas.toLocaleString("en-US")
                  : parseFloat(usdCuotas).toLocaleString("en-US")}
              </Metric>
            </Card>
            <Card className={`bg-slate-800 border border-slate-700 rounded-lg ${isMobile ? "min-w-[200px]" : ""}`}>
              <Text className="text-gray-400">USD Fijos</Text>
              <Metric className="text-white">
                {typeof usdFijos === "number"
                  ? usdFijos.toLocaleString("en-US")
                  : parseFloat(usdFijos).toLocaleString("en-US")}
              </Metric>
            </Card>
          </div>
        </div>
      </div>

      {/* Charts - conditional based on view */}
      {view === "yearly" ? (
        <>
          {/* Line Charts for Yearly View */}
          <ExpenseLineCharts expenses={expenses} categories={categories} />
          {/* Pie Chart */}
          <ExpensePieChart expenses={expenses} categories={categories} />
        </>
      ) : (
        <>
          {/* Pie Chart for Monthly View */}
          <ExpensePieChart expenses={expenses} categories={categories} />
        </>
      )}

      {/* Tables - shown in both views */}
      <ExpenseTables
        expenses={expenses}
        categories={categories}
        paymentMethods={paymentMethods}
      />
    </div>
  );
}
