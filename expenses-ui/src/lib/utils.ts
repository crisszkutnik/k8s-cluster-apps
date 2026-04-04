import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Expense, RecurrentExpense } from "./types"

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

// Check if a recurrent expense is active for a given period
export function isRecurrentExpenseActive(
  recurrentExpense: RecurrentExpense,
  periodStart: string,
  periodEnd: string
): boolean {
  const startDate = new Date(recurrentExpense.startDate);
  const endDate = recurrentExpense.endDate ? new Date(recurrentExpense.endDate) : null;
  const periodStartDate = new Date(periodStart);
  const periodEndDate = new Date(periodEnd);

  // Recurrent expense is active if:
  // - It started before or during the period
  // - It hasn't ended, OR it ended after the period started
  return (
    startDate <= periodEndDate &&
    (!endDate || endDate >= periodStartDate)
  );
}

// Find missing recurrent expenses for a given period
export function findMissingRecurrentExpenses(
  recurrentExpenses: RecurrentExpense[],
  expenses: Expense[],
  periodStart: string,
  periodEnd: string
): RecurrentExpense[] {
  // Get the set of recurrentExpenseIds that already have expenses in this period
  const existingRecurrentIds = new Set(
    expenses
      .filter(e => e.recurrentExpenseId)
      .map(e => e.recurrentExpenseId)
  );

  // Filter to recurrent expenses that are:
  // 1. Active in this period
  // 2. Don't have an expense recorded yet
  return recurrentExpenses.filter(recurrent => {
    const isActive = isRecurrentExpenseActive(recurrent, periodStart, periodEnd);
    const hasExpense = existingRecurrentIds.has(recurrent.id);
    return isActive && !hasExpense;
  });
}
