import { create } from "zustand";
import type { Category } from "../types";

interface CategoryStoreState {
  categories: Category[];
  fullyLoaded: boolean;
  setCategories: (newCategories: Category[]) => void;
  setAllCategories: (newCategories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, name: string) => void;
}

export const useCategoryStore = create<CategoryStoreState>((set) => ({
  categories: [],
  fullyLoaded: false,
  setCategories: (newCategories: Category[]) => {
    set((state) => {
      if (state.fullyLoaded) return {};
      return { categories: newCategories };
    });
  },
  setAllCategories: (newCategories: Category[]) => {
    set({ categories: newCategories, fullyLoaded: true });
  },
  addCategory: (category: Category) => {
    set((state) => ({
      categories: [...state.categories, category].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }));
  },
  updateCategory: (id: string, name: string) => {
    set((state) => ({
      categories: state.categories
        .map((c) => (c.id === id ? { ...c, name } : c))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  },
}));
