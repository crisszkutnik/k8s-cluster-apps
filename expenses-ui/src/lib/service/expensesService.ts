import axios from "axios";
import type { Expense } from "../types";

export async function loadExpenses(month?: string) {
  // If month is provided, use it; otherwise use today's date in YYYY-MM format
  let startDate: string;
  let endDate: string;

  if (month) {
    // month is in "YYYY-MM" format
    const [year, monthStr] = month.split("-");

    // First day of the month
    startDate = `${month}-01`;

    // Last day of the month
    const lastDay = new Date(parseInt(year), parseInt(monthStr), 0).getDate();
    endDate = `${month}-${String(lastDay).padStart(2, "0")}`;
  } else {
    const today = new Date();
    const year = today.getFullYear();
    const monthStr = String(today.getMonth() + 1).padStart(2, "0");

    // First day of the current month
    startDate = `${year}-${monthStr}-01`;

    // Last day of the current month
    const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
    endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;
  }

  const { data } = await axios.get<Expense[]>("http://localhost:3100/expense", {
    params: {
      startDate,
      endDate,
    },
  });
  return data;
}
