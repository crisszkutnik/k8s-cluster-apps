import { create } from "zustand";
import type { Expense } from "../types";

interface ExpenseCache {
  monthly: { [key: string]: Expense[] }; // key format: "YYYY-MM"
  yearly: { [key: string]: Expense[] }; // key format: "YYYY"
}

interface ExpenseStoreState {
  expenses: Expense[];
  cache: ExpenseCache;
  currentMonth: string; // "YYYY-MM" format
  currentYear: string; // "YYYY" format
  view: "monthly" | "yearly";
  setExpenses: (
    newExpenses: Expense[],
    period: string,
    view: "monthly" | "yearly"
  ) => void;
  getExpensesByPeriod: (
    period: string,
    view: "monthly" | "yearly"
  ) => Expense[] | null;
  setCurrentPeriod: (period: string, view: "monthly" | "yearly") => void;
  setView: (view: "monthly" | "yearly") => void;
  invalidateCache: (period: string, view: "monthly" | "yearly") => void;
}

export const useExpenseStore = create<ExpenseStoreState>((set, get) => ({
  expenses: [],
  cache: {
    monthly: {},
    yearly: {},
  },
  currentMonth: "",
  currentYear: "",
  view: "monthly",

  setExpenses: (
    newExpenses: Expense[],
    period: string,
    view: "monthly" | "yearly"
  ) => {
    if (view === "monthly") {
      set((state) => ({
        expenses: newExpenses,
        cache: {
          ...state.cache,
          monthly: {
            ...state.cache.monthly,
            [period]: newExpenses,
          },
        },
        currentMonth: period,
        view: "monthly",
      }));
    } else {
      set((state) => ({
        expenses: newExpenses,
        cache: {
          ...state.cache,
          yearly: {
            ...state.cache.yearly,
            [period]: newExpenses,
          },
        },
        currentYear: period,
        view: "yearly",
      }));
    }
  },

  getExpensesByPeriod: (period: string, view: "monthly" | "yearly") => {
    if (view === "monthly") {
      return get().cache.monthly[period] || null;
    } else {
      return get().cache.yearly[period] || null;
    }
  },

  setCurrentPeriod: (period: string, view: "monthly" | "yearly") => {
    const cached = get().getExpensesByPeriod(period, view);
    if (cached) {
      if (view === "monthly") {
        set({
          expenses: cached,
          currentMonth: period,
          view: "monthly",
        });
      } else {
        set({
          expenses: cached,
          currentYear: period,
          view: "yearly",
        });
      }
    }
  },

  setView: (view: "monthly" | "yearly") => {
    set({ view });
  },

  invalidateCache: (period: string, view: "monthly" | "yearly") => {
    if (view === "monthly") {
      set((state) => {
        const newMonthly = { ...state.cache.monthly };
        delete newMonthly[period];
        return {
          cache: {
            ...state.cache,
            monthly: newMonthly,
          },
        };
      });
    } else {
      set((state) => {
        const newYearly = { ...state.cache.yearly };
        delete newYearly[period];
        return {
          cache: {
            ...state.cache,
            yearly: newYearly,
          },
        };
      });
    }
  },
}));
