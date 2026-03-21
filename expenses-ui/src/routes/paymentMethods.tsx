import { createFileRoute } from "@tanstack/react-router";
import { PaymentMethods } from "../pages/PaymentMethods";
import { ROUTES } from "./routes";
import { loadPaymentMethods } from "../lib/service/paymentMethodService";
import { usePaymentMethodStore } from "../lib/stores/paymentMethodStore";

export const Route = createFileRoute(ROUTES.PAYMENT_METHODS)({
  beforeLoad: async () => {
    const paymentMethods = await loadPaymentMethods();
    usePaymentMethodStore.getState().setAllPaymentMethods(paymentMethods);
  },
  component: PaymentMethods,
});
