import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "../components/theme-provider";
import { TremorProvider } from "../components/tremor-provider";
import { Sidebar } from "../components/Sidebar";
import { ToastContainer } from "../components/ui/toast";
import { loadInsertData } from "../lib/service/insertData";
import { useCategoryStore } from "../lib/stores/categoryStore";
import { useSubcategoryStore } from "../lib/stores/subcategoryStore";
import { usePaymentMethodStore } from "../lib/stores/paymentMethodStore";
import { useRecurrentExpenseStore } from "../lib/stores/recurrentExpenseStore";

// Flag to track if we've already loaded insert data
let insertDataLoaded = false;

export const Route = createRootRoute({
  beforeLoad: async () => {
    // Only load insert data once on first app load
    if (!insertDataLoaded) {
      const data = await loadInsertData();
      useCategoryStore.getState().setCategories(data.categories);
      useSubcategoryStore.getState().setSubcategories(data.subcategories);
      usePaymentMethodStore.getState().setPaymentMethods(data.paymentMethods);
      useRecurrentExpenseStore
        .getState()
        .setRecurrentExpenses(data.recurrentExpenses);
      insertDataLoaded = true;
    }
  },
  component: () => (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TremorProvider>
          <div className="flex w-screen h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto p-8">
              <Outlet />
            </main>
          </div>
          <ToastContainer />
        </TremorProvider>
      </ThemeProvider>
      <TanStackRouterDevtools />
    </>
  ),
});
