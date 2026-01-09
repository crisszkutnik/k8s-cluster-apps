import { create } from "zustand";
import type { Expense } from "../types";

interface ExpenseCache {
  [key: string]: Expense[]; // key format: "YYYY-MM"
}

interface ExpenseStoreState {
  expenses: Expense[];
  cache: ExpenseCache;
  currentMonth: string; // "YYYY-MM" format
  setExpenses: (newExpenses: Expense[], month: string) => void;
  getExpensesByMonth: (month: string) => Expense[] | null;
  setCurrentMonth: (month: string) => void;
}

export const useExpenseStore = create<ExpenseStoreState>((set, get) => ({
  expenses: [],
  cache: {},
  currentMonth: "",

  setExpenses: (newExpenses: Expense[], month: string) => {
    set((state) => ({
      expenses: newExpenses,
      cache: {
        ...state.cache,
        [month]: newExpenses,
      },
      currentMonth: month,
    }));
  },

  getExpensesByMonth: (month: string) => {
    return get().cache[month] || null;
  },

  setCurrentMonth: (month: string) => {
    const cached = get().cache[month];
    if (cached) {
      set({
        expenses: cached,
        currentMonth: month,
      });
    }
  },
}));
