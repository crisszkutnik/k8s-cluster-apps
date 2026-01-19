import { create } from "zustand";
import type { Category } from "../types";

interface CategoryStoreState {
  categories: Category[];
  setCategories: (newCategories: Category[]) => void;
}

export const useCategoryStore = create<CategoryStoreState>((set) => ({
  categories: [],
  setCategories: (newCategories: Category[]) => {
    set({ categories: newCategories });
  },
}));
