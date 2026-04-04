import { create } from "zustand";

interface ExpenseModalState {
  isOpen: boolean;
  defaultRecurrentExpenseId?: string;
  defaultCategoryId?: string;
  defaultSubcategoryId?: string;
  onSuccess?: () => void;
  openModal: (options?: {
    recurrentExpenseId?: string;
    categoryId?: string;
    subcategoryId?: string;
    onSuccess?: () => void;
  }) => void;
  closeModal: () => void;
}

export const useExpenseModalStore = create<ExpenseModalState>((set) => ({
  isOpen: false,
  defaultRecurrentExpenseId: undefined,
  defaultCategoryId: undefined,
  defaultSubcategoryId: undefined,
  onSuccess: undefined,
  openModal: (options) => {
    set({
      isOpen: true,
      defaultRecurrentExpenseId: options?.recurrentExpenseId,
      defaultCategoryId: options?.categoryId,
      defaultSubcategoryId: options?.subcategoryId,
      onSuccess: options?.onSuccess,
    });
  },
  closeModal: () => {
    set({
      isOpen: false,
      defaultRecurrentExpenseId: undefined,
      defaultCategoryId: undefined,
      defaultSubcategoryId: undefined,
      onSuccess: undefined,
    });
  },
}));
