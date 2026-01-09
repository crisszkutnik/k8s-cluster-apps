import { create } from "zustand";
import type { Subcategory } from "../types";

interface SubcategoryStoreState {
  subcategories: Subcategory[];
  setSubcategories: (newSubcategories: Subcategory[]) => void;
}

export const useSubcategoryStore = create<SubcategoryStoreState>((set) => ({
  subcategories: [],
  setSubcategories: (newSubcategories: Subcategory[]) => {
    set({ subcategories: newSubcategories });
  },
}));
