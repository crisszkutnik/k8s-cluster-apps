import axios from "axios";
import type { PaymentMethod } from "../types";

export async function loadPaymentMethods(): Promise<PaymentMethod[]> {
  const { data } = await axios.get<PaymentMethod[]>(
    `${import.meta.env.VITE_API_BASE_URL}/paymentMethod`,
  );
  return data;
}

export async function createPaymentMethod(name: string): Promise<PaymentMethod> {
  const { data } = await axios.post<PaymentMethod>(
    `${import.meta.env.VITE_API_BASE_URL}/paymentMethod`,
    { name },
  );
  return data;
}

export async function updatePaymentMethod(id: string, name: string): Promise<void> {
  await axios.patch(
    `${import.meta.env.VITE_API_BASE_URL}/paymentMethod/${id}`,
    { name },
  );
}
