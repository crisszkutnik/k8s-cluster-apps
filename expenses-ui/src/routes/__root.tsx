import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useState } from "react";
import { ThemeProvider } from "../components/theme-provider";
import { TremorProvider } from "../components/tremor-provider";
import { Sidebar } from "../components/Sidebar";
import { ToastContainer } from "../components/ui/toast";
import { loadInsertData } from "../lib/service/insertData";
import { useCategoryStore } from "../lib/stores/categoryStore";
import { useSubcategoryStore } from "../lib/stores/subcategoryStore";
import { usePaymentMethodStore } from "../lib/stores/paymentMethodStore";
import { useRecurrentExpenseStore } from "../lib/stores/recurrentExpenseStore";
import { useIsMobile } from "../hooks/use-mobile";
import { Menu, X } from "lucide-react";

// Flag to track if we've already loaded insert data
let insertDataLoaded = false;

function RootComponent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TremorProvider>
          <div className="flex w-screen h-screen relative">
            {/* Mobile menu button */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-md border border-slate-700 hover:bg-slate-700 transition-colors"
                aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}

            {/* Sidebar with overlay on mobile */}
            {isMobile && sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-30"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <div
              className={`${
                isMobile
                  ? `fixed left-0 top-0 h-full z-40 transition-transform duration-300 ${
                      sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`
                  : ""
              }`}
            >
              <Sidebar onNavigate={() => isMobile && setSidebarOpen(false)} />
            </div>

            {/* Main content */}
            <main className={`flex-1 overflow-auto ${isMobile ? "p-4 pt-16" : "p-8"}`}>
              <Outlet />
            </main>
          </div>
          <ToastContainer />
        </TremorProvider>
      </ThemeProvider>
      <TanStackRouterDevtools />
    </>
  );
}

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
  component: RootComponent,
});
