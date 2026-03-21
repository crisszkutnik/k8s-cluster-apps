import { useMemo } from "react";
import { Link, useParams, useRouter, useSearch } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ChevronLeft as PrevIcon, Calendar } from "lucide-react";
import { useCategoryStore } from "../lib/stores/categoryStore";
import { useSubcategoryStore } from "../lib/stores/subcategoryStore";
import { usePaymentMethodStore } from "../lib/stores/paymentMethodStore";
import { useExpenseStore } from "../lib/stores/expenseStore";
import { NewExpenseModal } from "../components/NewExpenseModal";
import { ExpenseTables } from "../components/ExpenseTables";
import { CategoryExpenseChart } from "../components/CategoryExpenseChart";
import { Button } from "../components/ui/button";
import { Combobox } from "../components/ui/combobox";
import { ROUTES } from "../routes/routes";
import {
  currentMonthStr,
  formatMonth,
  prevMonth,
  nextMonth,
} from "../lib/dateUtils";
import type { CategoryDetailSearch } from "../routes/category_.$id";

type DateView = "all" | "monthly" | "yearly";

export function CategoryDetail() {
  const { id = "" } = useParams({ strict: false });
  const rawSearch = useSearch({ strict: false }) as CategoryDetailSearch;
  const router = useRouter();

  const categories = useCategoryStore((state) => state.categories);
  const allSubcategories = useSubcategoryStore((state) => state.subcategories);
  const paymentMethods = usePaymentMethodStore((state) => state.paymentMethods);
  const allCategoryExpenses = useExpenseStore((state) => state.getCategoryExpenses(id));

  const category = categories.find((c) => c.id === id);
  const subcategories = allSubcategories.filter((s) => s.categoryId === id);
  const subcategoryOptions = [
    { value: "", label: "All" },
    ...subcategories.map((sub) => ({ value: sub.id, label: sub.name })),
  ];

  const view: DateView = rawSearch.view ?? "yearly";
  const selectedMonth = rawSearch.month ?? currentMonthStr();
  const selectedYear = rawSearch.year ?? new Date().getFullYear();
  const selectedSubcategoryId = rawSearch.subcategoryId;

  const expenses = selectedSubcategoryId
    ? allCategoryExpenses.filter((e) => e.subcategoryId === selectedSubcategoryId)
    : allCategoryExpenses;

  const totalArs = expenses.reduce((sum, e) => sum + (e.arsAmount ?? 0), 0);
  const totalUsd = expenses.reduce((sum, e) => sum + (e.usdAmount ?? 0), 0);

  const subcategoryBreakdown = useMemo(() => {
    const groups = new Map<string | null, { ars: number; usd: number }>();
    for (const e of expenses) {
      const key = e.subcategoryId ?? null;
      const existing = groups.get(key) ?? { ars: 0, usd: 0 };
      groups.set(key, {
        ars: existing.ars + (e.arsAmount ?? 0),
        usd: existing.usd + (e.usdAmount ?? 0),
      });
    }
    return Array.from(groups.entries())
      .map(([subcategoryId, totals]) => ({
        subcategoryId,
        name: subcategoryId
          ? (subcategories.find((s) => s.id === subcategoryId)?.name ?? subcategoryId)
          : "—",
        totalArs: totals.ars,
        totalUsd: totals.usd,
      }))
      .sort((a, b) => {
        if (a.subcategoryId === null) return 1;
        if (b.subcategoryId === null) return -1;
        return a.name.localeCompare(b.name);
      });
  }, [expenses, subcategories]);

  const hasSubcategoryData = !selectedSubcategoryId && subcategoryBreakdown.some((g) => g.subcategoryId !== null);

  const navigate = (search: CategoryDetailSearch) => {
    void router.navigate({
      to: ROUTES.CATEGORY_DETAIL,
      params: { id },
      search,
      replace: true,
    });
  };

  const handleViewChange = (nextView: DateView) => {
    if (nextView === "all") {
      navigate({ view: nextView, subcategoryId: selectedSubcategoryId });
    } else if (nextView === "monthly") {
      navigate({ view: nextView, month: selectedMonth, subcategoryId: selectedSubcategoryId });
    } else {
      navigate({ view: nextView, year: selectedYear, subcategoryId: selectedSubcategoryId });
    }
  };

  const handleMonthChange = (month: string) => {
    navigate({ view: "monthly", month, subcategoryId: selectedSubcategoryId });
  };

  const handleYearChange = (year: number) => {
    navigate({ view: "yearly", year, subcategoryId: selectedSubcategoryId });
  };

  const handleSubcategoryChange = (subcategoryId: string | undefined) => {
    if (view === "all") {
      navigate({ view, subcategoryId });
    } else if (view === "monthly") {
      navigate({ view, month: selectedMonth, subcategoryId });
    } else {
      navigate({ view, year: selectedYear, subcategoryId });
    }
  };

  const handleExpenseChanged = () => {
    void router.invalidate();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <Link
            to={ROUTES.CATEGORIES}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <PrevIcon size={16} />
            Categories
          </Link>
          <h1 className="text-3xl font-bold">{category?.name ?? "Category"}</h1>
          <p className="text-muted-foreground">All expenses in this category</p>
        </div>

        <div className="flex items-center gap-3 pt-6">
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1">
            {(["all", "monthly", "yearly"] as DateView[]).map((v) => (
              <button
                key={v}
                onClick={() => handleViewChange(v)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  view === v ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {v === "all" ? "All" : v === "monthly" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>

          {view === "monthly" && (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleMonthChange(prevMonth(selectedMonth))}
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm font-medium px-2 flex items-center gap-1.5">
                <Calendar size={14} className="text-muted-foreground" />
                {formatMonth(selectedMonth)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleMonthChange(nextMonth(selectedMonth))}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          )}

          {view === "yearly" && (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleYearChange(selectedYear - 1)}
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm font-medium px-2 flex items-center gap-1.5">
                <Calendar size={14} className="text-muted-foreground" />
                {selectedYear}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleYearChange(selectedYear + 1)}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          )}

          <NewExpenseModal defaultCategoryId={id} defaultSubcategoryId={selectedSubcategoryId} onSuccess={handleExpenseChanged} compact />
        </div>

      </div>

        {subcategories.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Subcategory:</span>
            <Combobox
              options={subcategoryOptions}
              value={selectedSubcategoryId ?? ""}
              onValueChange={(value) => handleSubcategoryChange(value || undefined)}
              placeholder="All"
              searchPlaceholder="Search subcategories..."
              emptyText="No subcategories found."
              className="w-52"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total ARS</p>
          <p className="text-2xl font-bold text-white">
            {totalArs > 0 ? `$${totalArs.toLocaleString("es-AR")}` : "—"}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total USD</p>
          <p className="text-2xl font-bold text-white">
            {totalUsd > 0 ? `U$D ${totalUsd.toFixed(2)}` : "—"}
          </p>
        </div>
      </div>

      {hasSubcategoryData && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-blue-400 font-medium">subcategory</th>
                <th className="text-right py-3 px-4 text-blue-400 font-medium">total_ars</th>
                <th className="text-right py-3 px-4 text-blue-400 font-medium">total_usd</th>
              </tr>
            </thead>
            <tbody>
              {subcategoryBreakdown.map((row) => (
                <tr
                  key={row.subcategoryId ?? "__none__"}
                  className="border-b border-slate-800 last:border-0 hover:bg-slate-800/50"
                >
                  <td className="py-3 px-4 text-white font-medium">{row.name}</td>
                  <td className="py-3 px-4 text-white text-right">
                    {row.totalArs > 0 ? `$${row.totalArs.toLocaleString("es-AR")}` : "—"}
                  </td>
                  <td className="py-3 px-4 text-white text-right">
                    {row.totalUsd > 0 ? `U$D ${row.totalUsd.toFixed(2)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CategoryExpenseChart expenses={expenses} view={view} />

      <ExpenseTables
        expenses={expenses}
        categories={categories}
        paymentMethods={paymentMethods}
        onExpenseUpdated={handleExpenseChanged}
      />
    </div>
  );
}
