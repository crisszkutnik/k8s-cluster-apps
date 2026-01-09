import axios from "axios";
import type {
  Category,
  PaymentMethod,
  RecurrentExpense,
  Subcategory,
} from "../types";

interface InsertData {
  categories: Category[];
  subcategories: Subcategory[];
  paymentMethods: PaymentMethod[];
  recurrentExpenses: RecurrentExpense[];
}

export interface NewExpensePayload {
  description: string;
  paymentMethodId: string;
  arsAmount: number;
  usdAmount: number;
  categoryId: string;
  subcategoryId?: string;
  recurrentExpenseId?: string;
  date: string;
}

export async function loadInsertData(): Promise<InsertData> {
  const { data } = await axios.get<InsertData>(
    "http://localhost:3100/expense/insertInformation?withRecurrent=true"
  );
  return data;
}

export async function insertData(payload: NewExpensePayload) {
  await axios.post("http://localhost:3100/expense", payload);
}
