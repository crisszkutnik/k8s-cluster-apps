import { AlertCircle } from "lucide-react";
import { Card } from "@tremor/react";
import type { RecurrentExpense } from "../lib/types";
import { Button } from "./ui/button";

interface MissingRecurrentExpensesWarningProps {
  missingExpenses: RecurrentExpense[];
  onAddExpense: (recurrentExpense: RecurrentExpense) => void;
}

export function MissingRecurrentExpensesWarning({
  missingExpenses,
  onAddExpense,
}: MissingRecurrentExpensesWarningProps) {
  if (missingExpenses.length === 0) {
    return null;
  }

  return (
    <Card className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-yellow-500 mt-0.5 flex-shrink-0" size={20} />
        <div className="flex-1">
          <h3 className="text-yellow-500 font-semibold mb-2">
            Missing Recurrent Expenses
          </h3>
          <p className="text-gray-300 text-sm mb-3">
            The following recurrent expenses have not been added for this period:
          </p>
          <ul className="space-y-2">
            {missingExpenses.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between gap-4 bg-slate-800/50 rounded-md p-3"
              >
                <div className="flex-1">
                  <div className="text-white font-medium">{expense.description}</div>
                  <div className="text-gray-400 text-sm mt-1">
                    {expense.arsAmount && (
                      <span>ARS {expense.arsAmount.toLocaleString("es-AR")}</span>
                    )}
                    {expense.arsAmount && expense.usdAmount && (
                      <span className="mx-2">•</span>
                    )}
                    {expense.usdAmount && (
                      <span>USD {expense.usdAmount.toLocaleString("en-US")}</span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => onAddExpense(expense)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white flex-shrink-0"
                >
                  Add
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
