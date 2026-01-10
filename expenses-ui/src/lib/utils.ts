import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Expense } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Expense categorization utilities
export function isMonthlyExpense(expense: Expense): boolean {
  return !expense.recurrentExpenseId && !expense.installementsExpenseId;
}

export function isInstallmentExpense(expense: Expense): boolean {
  return !!expense.installementsExpenseId && !expense.recurrentExpenseId;
}

export function isRecurrentExpense(expense: Expense): boolean {
  return !!expense.recurrentExpenseId && !expense.installementsExpenseId;
}

export function categorizeExpenses(expenses: Expense[]) {
  const monthly = expenses.filter(isMonthlyExpense);
  const installments = expenses.filter(isInstallmentExpense);
  const recurrent = expenses.filter(isRecurrentExpense);
  
  return {
    monthly,
    installments,
    recurrent,
  };
}
