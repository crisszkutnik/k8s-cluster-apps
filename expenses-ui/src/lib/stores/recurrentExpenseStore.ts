import { create } from "zustand";
import type { RecurrentExpense } from "../types";

interface RecurrentExpenseStoreState {
  recurrentExpenses: RecurrentExpense[];
  setRecurrentExpenses: (newRecurrentExpenses: RecurrentExpense[]) => void;
}

export const useRecurrentExpenseStore = create<RecurrentExpenseStoreState>((set) => ({
  recurrentExpenses: [],
  setRecurrentExpenses: (newRecurrentExpenses: RecurrentExpense[]) => {
    set({ recurrentExpenses: newRecurrentExpenses });
  },
}));

