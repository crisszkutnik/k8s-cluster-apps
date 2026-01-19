import { createFileRoute } from "@tanstack/react-router";
import { Home } from "../pages/Home";
import { ROUTES } from "./routes";
import { loadExpenses, loadYearlyExpenses } from "../lib/service/expensesService";
import { useExpenseStore } from "../lib/stores/expenseStore";
import { z } from "zod";

const homeSearchSchema = z.object({
  month: z.string().optional().catch(undefined),
  year: z.coerce.number().optional().catch(undefined),
  view: z.enum(["monthly", "yearly"]).optional().catch(undefined),
});

type HomeSearch = z.infer<typeof homeSearchSchema>;

export const Route = createFileRoute(ROUTES.HOME)({
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    return homeSearchSchema.parse(search);
  },
  beforeLoad: async ({ search }) => {
    const { month, year, view } = search as HomeSearch;
    
    // Determine the view (default to monthly)
    const currentView = view || "monthly";
    
    if (currentView === "yearly") {
      // Get current year if not provided
      const currentYear = String(year || new Date().getFullYear());

      // Check if we already have this year cached
      const cached = useExpenseStore.getState().getExpensesByPeriod(currentYear, "yearly");

      // Only load if not cached
      if (!cached) {
        const expenses = await loadYearlyExpenses(currentYear);
        useExpenseStore.getState().setExpenses(expenses, currentYear, "yearly");
      } else {
        // If cached, just set it as current
        useExpenseStore.getState().setCurrentPeriod(currentYear, "yearly");
      }
    } else {
      // Monthly view
      // Get current month if not provided
      const currentMonth =
        month ||
        new Date().toLocaleDateString("en-CA", {
          year: "numeric",
          month: "2-digit",
        });

      // Check if we already have this month cached
      const cached = useExpenseStore.getState().getExpensesByPeriod(currentMonth, "monthly");

      // Only load if not cached
      if (!cached) {
        const expenses = await loadExpenses(currentMonth);
        useExpenseStore.getState().setExpenses(expenses, currentMonth, "monthly");
      } else {
        // If cached, just set it as current
        useExpenseStore.getState().setCurrentPeriod(currentMonth, "monthly");
      }
    }
    
    // Update the view in the store
    useExpenseStore.getState().setView(currentView);
  },
  component: Home,
});
