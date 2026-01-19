import { create } from "zustand";
import type { PaymentMethod } from "../types";

interface PaymentMethodStoreState {
  paymentMethods: PaymentMethod[];
  setPaymentMethods: (newPaymentMethods: PaymentMethod[]) => void;
}

export const usePaymentMethodStore = create<PaymentMethodStoreState>((set) => ({
  paymentMethods: [],
  setPaymentMethods: (newPaymentMethods: PaymentMethod[]) => {
    set({ paymentMethods: newPaymentMethods });
  },
}));

