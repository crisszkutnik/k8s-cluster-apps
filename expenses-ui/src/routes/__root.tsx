import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "../components/theme-provider";
import { Sidebar } from "../components/Sidebar";
import { ToastContainer } from "../components/ui/toast";
import { loadInsertData } from "../lib/service/insertData";
import { loadExpenses } from "../lib/service/expensesService";
import { useCategoryStore } from "../lib/stores/categoryStore";
import { useSubcategoryStore } from "../lib/stores/subcategoryStore";
import { usePaymentMethodStore } from "../lib/stores/paymentMethodStore";
import { useRecurrentExpenseStore } from "../lib/stores/recurrentExpenseStore";
import { useExpenseStore } from "../lib/stores/expenseStore";

export const Route = createRootRoute({
  beforeLoad: async () => {
    const data = await loadInsertData();
    const expenses = await loadExpenses();
    useCategoryStore.getState().setCategories(data.categories);
    useSubcategoryStore.getState().setSubcategories(data.subcategories);
    usePaymentMethodStore.getState().setPaymentMethods(data.paymentMethods);
    useRecurrentExpenseStore
      .getState()
      .setRecurrentExpenses(data.recurrentExpenses);
    useExpenseStore.getState().setExpenses(expenses);
  },
  component: () => (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="flex w-screen h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto p-8">
            <Outlet />
          </main>
        </div>
        <ToastContainer />
      </ThemeProvider>
      <TanStackRouterDevtools />
    </>
  ),
});
