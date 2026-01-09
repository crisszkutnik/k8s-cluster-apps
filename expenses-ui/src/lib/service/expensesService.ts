import axios from "axios";
import type { Expense } from "../types";

export async function loadExpenses() {
  const { data } = await axios.get<Expense[]>("http://localhost:3100/expense");
  return data;
}
