import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CategoryDetail } from "../pages/CategoryDetail";
import { loadExpensesByCategory } from "../lib/service/expensesService";
import { useExpenseStore } from "../lib/stores/expenseStore";
import { getMonthRange, getYearRange, currentMonthStr } from "../lib/dateUtils";

const categoryDetailSearchSchema = z.object({
  view: z.enum(["all", "monthly", "yearly"]).optional().catch(undefined),
  month: z.string().optional().catch(undefined),
  year: z.coerce.number().int().optional().catch(undefined),
  subcategoryId: z.string().optional().catch(undefined),
});

export type CategoryDetailSearch = z.infer<typeof categoryDetailSearchSchema>;

export const Route = createFileRoute('/category_/$id')({
  validateSearch: (search): CategoryDetailSearch => categoryDetailSearchSchema.parse(search),
  beforeLoad: async ({ params, search }) => {
    const view = search.view ?? "yearly";

    let startDate: string | undefined;
    let endDate: string | undefined;

    if (view === "monthly") {
      const month = search.month ?? currentMonthStr();
      ({ startDate, endDate } = getMonthRange(month));
    } else if (view === "yearly") {
      const year = search.year ?? new Date().getFullYear();
      ({ startDate, endDate } = getYearRange(String(year)));
    }

    const expenses = await loadExpensesByCategory(params.id, startDate, endDate, search.subcategoryId);
    useExpenseStore.getState().setCategoryExpenses(params.id, expenses);
  },
  component: CategoryDetail,
});
