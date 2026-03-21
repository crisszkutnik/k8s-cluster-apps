import axios from "axios";
import type { Expense } from "../types";

export async function loadExpenses(month?: string) {
  let startDate: string;
  let endDate: string;

  if (month) {
    const [year, monthStr] = month.split("-");

    startDate = `${month}-01`;

    const lastDay = new Date(parseInt(year), parseInt(monthStr), 0).getDate();
    endDate = `${month}-${String(lastDay).padStart(2, "0")}`;
  } else {
    const today = new Date();
    const year = today.getFullYear();
    const monthStr = String(today.getMonth() + 1).padStart(2, "0");

    startDate = `${year}-${monthStr}-01`;

    const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
    endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;
  }

  const { data } = await axios.get<Expense[]>(
    `${import.meta.env.VITE_API_BASE_URL}/expense`,
    {
      params: {
        startDate,
        endDate,
      },
    },
  );
  return data;
}

export async function loadExpensesByCategory(
  categoryId: string,
  startDate?: string,
  endDate?: string,
  subcategoryId?: string,
): Promise<Expense[]> {
  const { data } = await axios.get<Expense[]>(
    `${import.meta.env.VITE_API_BASE_URL}/expense`,
    {
      params: {
        categoryId,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(subcategoryId && { subcategoryId }),
      },
    },
  );
  return data;
}

export async function loadYearlyExpenses(year?: string) {
  let startDate: string;
  let endDate: string;

  if (year) {
    startDate = `${year}-01-01`;
    endDate = `${year}-12-31`;
  } else {
    const today = new Date();
    const currentYear = today.getFullYear();
    startDate = `${currentYear}-01-01`;
    endDate = `${currentYear}-12-31`;
  }

  const { data } = await axios.get<Expense[]>(
    `${import.meta.env.VITE_API_BASE_URL}/expense`,
    {
      params: {
        startDate,
        endDate,
      },
    },
  );
  return data;
}
