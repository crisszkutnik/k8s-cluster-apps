import { create } from "zustand";
import type { Expense } from "../types";

interface ExpenseStoreState {
  expenses: Expense[];
  setExpenses: (newExpenses: Expense[]) => void;
}

export const useExpenseStore = create<ExpenseStoreState>((set) => ({
  expenses: [],
  setExpenses: (newExpenses: Expense[]) => {
    set({ expenses: newExpenses });
  },
}));
