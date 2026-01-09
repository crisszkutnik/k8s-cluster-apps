import { createFileRoute } from "@tanstack/react-router";
import { Home } from "../pages/Home";
import { ROUTES } from "./routes";
import { loadExpenses } from "../lib/service/expensesService";
import { useExpenseStore } from "../lib/stores/expenseStore";
import { z } from "zod";

const homeSearchSchema = z.object({
  month: z.string().optional(),
});

type HomeSearch = z.infer<typeof homeSearchSchema>;

export const Route = createFileRoute(ROUTES.HOME)({
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    return homeSearchSchema.parse(search);
  },
  beforeLoad: async ({ search }) => {
    const { month } = search as HomeSearch;
    
    // Get current month if not provided
    const currentMonth =
      month ||
      new Date().toLocaleDateString("en-CA", {
        year: "numeric",
        month: "2-digit",
      });

    // Check if we already have this month cached
    const cached = useExpenseStore.getState().getExpensesByMonth(currentMonth);

    // Only load if not cached
    if (!cached) {
      const expenses = await loadExpenses(currentMonth);
      useExpenseStore.getState().setExpenses(expenses, currentMonth);
    } else {
      // If cached, just set it as current
      useExpenseStore.getState().setCurrentMonth(currentMonth);
    }
  },
  component: Home,
});
