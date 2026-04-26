import { useMemo } from "react";
import { Card, Metric, Text } from "@tremor/react";
import { useExpenseStore } from "../lib/stores/expenseStore";
import { useCategoryStore } from "../lib/stores/categoryStore";
import { usePaymentMethodStore } from "../lib/stores/paymentMethodStore";
import { useRecurrentExpenseStore } from "../lib/stores/recurrentExpenseStore";
import { useExpenseModalStore } from "../lib/stores/expenseModalStore";
import { MonthPicker } from "../components/MonthPicker";
import { YearPicker } from "../components/YearPicker";
import { CategoryFilterDropdown } from "../components/CategoryFilterDropdown";
import { ExpensePieChart } from "../components/ExpensePieChart";
import { ExpenseLineCharts } from "../components/ExpenseLineCharts";
import { ExpenseTables } from "../components/ExpenseTables";
import { MissingRecurrentExpensesWarning } from "../components/MissingRecurrentExpensesWarning";
import { categorizeExpenses, findMissingRecurrentExpenses } from "../lib/utils";
import { useRouter } from "@tanstack/react-router";
import { useIsMobile } from "../hooks/use-mobile";
import { loadExpenses, loadYearlyExpenses } from "../lib/service/expensesService";
import type { RecurrentExpense } from "../lib/types";

export function Home() {
  const router = useRouter();
  const expenses = useExpenseStore((state) => state.expenses);
  const getFilteredExpenses = useExpenseStore((state) => state.getFilteredExpenses);
  const excludedCategories = useExpenseStore((state) => state.filters.excludedCategories);
  const categories = useCategoryStore((state) => state.categories);
  const paymentMethods = usePaymentMethodStore((state) => state.paymentMethods);
  const recurrentExpenses = useRecurrentExpenseStore((state) => state.recurrentExpenses);
  const currentMonth = useExpenseStore((state) => state.currentMonth);
  const currentYear = useExpenseStore((state) => state.currentYear);
  const view = useExpenseStore((state) => state.view);
  const setExpenses = useExpenseStore((state) => state.setExpenses);
  const invalidateCache = useExpenseStore((state) => state.invalidateCache);
  const isMobile = useIsMobile();
  const { openModal } = useExpenseModalStore();

  const filteredExpenses = useMemo(() => getFilteredExpenses(), [expenses, excludedCategories, getFilteredExpenses]);

  const handleExpenseChange = async () => {
    if (view === "monthly") {
      invalidateCache(currentMonth, "monthly");
      const expenses = await loadExpenses(currentMonth);
      setExpenses(expenses, currentMonth, "monthly");
    } else {
      invalidateCache(currentYear, "yearly");
      const expenses = await loadYearlyExpenses(currentYear);
      setExpenses(expenses, currentYear, "yearly");
    }
  };

  const { monthly, installments, recurrent } = useMemo(
    () => categorizeExpenses(filteredExpenses),
    [filteredExpenses]
  );

  const { periodStart, periodEnd } = useMemo(() => {
    if (view === "monthly") {
      const month = currentMonth || new Date().toISOString().slice(0, 7);
      const [year, monthStr] = month.split("-");
      const lastDay = new Date(parseInt(year), parseInt(monthStr), 0).getDate();
      return {
        periodStart: `${month}-01`,
        periodEnd: `${month}-${String(lastDay).padStart(2, "0")}`,
      };
    } else {
      const year = currentYear || String(new Date().getFullYear());
      return {
        periodStart: `${year}-01-01`,
        periodEnd: `${year}-12-31`,
      };
    }
  }, [view, currentMonth, currentYear]);

  const missingRecurrentExpenses = useMemo(() => {
    return findMissingRecurrentExpenses(
      recurrentExpenses,
      expenses,
      periodStart,
      periodEnd
    );
  }, [recurrentExpenses, expenses, periodStart, periodEnd]);

  const handleAddMissingExpense = (recurrentExpense: RecurrentExpense) => {
    openModal({
      recurrentExpenseId: recurrentExpense.id,
      onSuccess: handleExpenseChange,
    });
  };

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

  const arsTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + (expense.arsAmount || 0), 0);
  }, [filteredExpenses]);

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
    return filteredExpenses.reduce((sum, expense) => sum + (expense.usdAmount || 0), 0);
  }, [filteredExpenses]);

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
    <div className={`max-w-7xl mx-auto space-y-8 ${isMobile ? "px-4" : ""}`}>
      <MissingRecurrentExpensesWarning
        missingExpenses={missingRecurrentExpenses}
        onAddExpense={handleAddMissingExpense}
      />

      <div className={`flex ${isMobile ? "flex-col gap-4" : "justify-between items-center"}`}>
        <div>
          <h1 className={`font-bold ${isMobile ? "text-2xl" : "text-3xl"} bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent`}>
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">Track and analyze your expenses</p>
        </div>
        <div className={`flex gap-3 ${isMobile ? "flex-col w-full" : "items-center"}`}>
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1 shadow-lg">
            <button
              onClick={() => handleViewChange("monthly")}
              className={`flex-1 px-4 ${isMobile ? "py-2.5" : "py-2"} rounded text-sm font-medium transition-all ${
                view === "monthly"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => handleViewChange("yearly")}
              className={`flex-1 px-4 ${isMobile ? "py-2.5" : "py-2"} rounded text-sm font-medium transition-all ${
                view === "yearly"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Yearly
            </button>
          </div>

          {view === "monthly" ? (
            <MonthPicker currentMonth={currentMonth} />
          ) : (
            <YearPicker currentYear={currentYear} />
          )}
          <CategoryFilterDropdown
            categories={categories}
            excludedCategoryIds={excludedCategories}
          />
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

      <div>
        <div className={`${isMobile ? "grid grid-cols-2 gap-3" : "grid grid-cols-4 gap-4"}`}>
          <Card className="bg-slate-800 border-2 border-blue-600/50 rounded-lg">
            <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total</Text>
            <Metric className={`text-white flex items-baseline gap-1.5 ${isMobile ? "text-xl" : ""}`}>
              <span className={`text-blue-400 font-semibold ${isMobile ? "text-sm" : "text-base"}`}>ARS</span>
              <span className={isMobile ? "text-lg" : ""}>{arsTotal.toLocaleString("es-AR")}</span>
            </Metric>
          </Card>
          <Card className="bg-slate-800 border border-slate-700 rounded-lg">
            <Text className="text-gray-500 text-xs font-medium uppercase tracking-wider">Monthly</Text>
            <Metric className={`text-white flex items-baseline gap-1.5 ${isMobile ? "text-xl" : ""}`}>
              <span className={`text-blue-400 font-semibold ${isMobile ? "text-sm" : "text-base"}`}>ARS</span>
              <span className={isMobile ? "text-lg" : ""}>{arsMes.toLocaleString("es-AR")}</span>
            </Metric>
          </Card>
          <Card className="bg-slate-800 border border-slate-700 rounded-lg">
            <Text className="text-gray-500 text-xs font-medium uppercase tracking-wider">Installments</Text>
            <Metric className={`text-white flex items-baseline gap-1.5 ${isMobile ? "text-xl" : ""}`}>
              <span className={`text-blue-400 font-semibold ${isMobile ? "text-sm" : "text-base"}`}>ARS</span>
              <span className={isMobile ? "text-lg" : ""}>{arsCuotas.toLocaleString("es-AR")}</span>
            </Metric>
          </Card>
          <Card className="bg-slate-800 border border-slate-700 rounded-lg">
            <Text className="text-gray-500 text-xs font-medium uppercase tracking-wider">Fixed</Text>
            <Metric className={`text-white flex items-baseline gap-1.5 ${isMobile ? "text-xl" : ""}`}>
              <span className={`text-blue-400 font-semibold ${isMobile ? "text-sm" : "text-base"}`}>ARS</span>
              <span className={isMobile ? "text-lg" : ""}>{arsFijos.toLocaleString("es-AR")}</span>
            </Metric>
          </Card>
        </div>
      </div>

      <div>
        <div className={`${isMobile ? "grid grid-cols-2 gap-3" : "grid grid-cols-4 gap-4"}`}>
          <Card className="bg-slate-800 border-2 border-emerald-600/50 rounded-lg">
            <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total</Text>
            <Metric className={`text-white flex items-baseline gap-1.5 ${isMobile ? "text-xl" : ""}`}>
              <span className={`text-emerald-400 font-semibold ${isMobile ? "text-sm" : "text-base"}`}>USD</span>
              <span className={isMobile ? "text-lg" : ""}>{usdTotal.toFixed(2)}</span>
            </Metric>
          </Card>
          <Card className="bg-slate-800 border border-slate-700 rounded-lg">
            <Text className="text-gray-500 text-xs font-medium uppercase tracking-wider">Monthly</Text>
            <Metric className={`text-white flex items-baseline gap-1.5 ${isMobile ? "text-xl" : ""}`}>
              <span className={`text-emerald-400 font-semibold ${isMobile ? "text-sm" : "text-base"}`}>USD</span>
              <span className={isMobile ? "text-lg" : ""}>{usdMes.toFixed(2)}</span>
            </Metric>
          </Card>
          <Card className="bg-slate-800 border border-slate-700 rounded-lg">
            <Text className="text-gray-500 text-xs font-medium uppercase tracking-wider">Installments</Text>
            <Metric className={`text-white flex items-baseline gap-1.5 ${isMobile ? "text-xl" : ""}`}>
              <span className={`text-emerald-400 font-semibold ${isMobile ? "text-sm" : "text-base"}`}>USD</span>
              <span className={isMobile ? "text-lg" : ""}>{usdCuotas.toFixed(2)}</span>
            </Metric>
          </Card>
          <Card className="bg-slate-800 border border-slate-700 rounded-lg">
            <Text className="text-gray-500 text-xs font-medium uppercase tracking-wider">Fixed</Text>
            <Metric className={`text-white flex items-baseline gap-1.5 ${isMobile ? "text-xl" : ""}`}>
              <span className={`text-emerald-400 font-semibold ${isMobile ? "text-sm" : "text-base"}`}>USD</span>
              <span className={isMobile ? "text-lg" : ""}>{usdFijos.toFixed(2)}</span>
            </Metric>
          </Card>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

      {view === "yearly" ? (
        <>
          <ExpenseLineCharts expenses={filteredExpenses} categories={categories} />
          <ExpensePieChart expenses={filteredExpenses} categories={categories} />
        </>
      ) : (
        <>
          <ExpensePieChart expenses={filteredExpenses} categories={categories} />
        </>
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

      <ExpenseTables
        expenses={filteredExpenses}
        categories={categories}
        paymentMethods={paymentMethods}
        onExpenseUpdated={handleExpenseChange}
      />
    </div>
  );
}
