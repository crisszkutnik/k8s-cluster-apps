import { create } from "zustand";
import type { PaymentMethod } from "../types";

interface PaymentMethodStoreState {
  paymentMethods: PaymentMethod[];
  fullyLoaded: boolean;
  setPaymentMethods: (newPaymentMethods: PaymentMethod[]) => void;
  setAllPaymentMethods: (newPaymentMethods: PaymentMethod[]) => void;
  addPaymentMethod: (paymentMethod: PaymentMethod) => void;
  updatePaymentMethod: (id: string, name: string) => void;
}

export const usePaymentMethodStore = create<PaymentMethodStoreState>((set) => ({
  paymentMethods: [],
  fullyLoaded: false,
  setPaymentMethods: (newPaymentMethods: PaymentMethod[]) => {
    set((state) => {
      if (state.fullyLoaded) return {};
      return { paymentMethods: newPaymentMethods };
    });
  },
  setAllPaymentMethods: (newPaymentMethods: PaymentMethod[]) => {
    set({ paymentMethods: newPaymentMethods, fullyLoaded: true });
  },
  addPaymentMethod: (paymentMethod: PaymentMethod) => {
    set((state) => ({
      paymentMethods: [...state.paymentMethods, paymentMethod].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }));
  },
  updatePaymentMethod: (id: string, name: string) => {
    set((state) => ({
      paymentMethods: state.paymentMethods
        .map((pm) => (pm.id === id ? { ...pm, name } : pm))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  },
}));
