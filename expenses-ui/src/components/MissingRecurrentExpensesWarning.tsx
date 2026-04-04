import { AlertCircle } from "lucide-react";
import { Card } from "@tremor/react";
import type { RecurrentExpense } from "../lib/types";
import { Button } from "./ui/button";
import { useIsMobile } from "../hooks/use-mobile";

interface MissingRecurrentExpensesWarningProps {
  missingExpenses: RecurrentExpense[];
  onAddExpense: (recurrentExpense: RecurrentExpense) => void;
}

export function MissingRecurrentExpensesWarning({
  missingExpenses,
  onAddExpense,
}: MissingRecurrentExpensesWarningProps) {
  const isMobile = useIsMobile();

  if (missingExpenses.length === 0) {
    return null;
  }

  return (
    <Card className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
      <div className="flex items-start gap-3">
        <div className={`p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20 ${isMobile ? "self-start" : ""}`}>
          <AlertCircle className="text-yellow-500 flex-shrink-0" size={isMobile ? 18 : 20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-yellow-400 font-semibold mb-1 flex ${isMobile ? "flex-col gap-1.5" : "items-center gap-2"} ${isMobile ? "text-sm" : "text-base"}`}>
            <span>Missing Recurrent Expenses</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 self-start">
              {missingExpenses.length}
            </span>
          </h3>
          <p className={`text-gray-400 mb-4 ${isMobile ? "text-xs" : "text-sm"}`}>
            These recurrent expenses haven't been added for this period yet
          </p>
          <ul className="space-y-2.5">
            {missingExpenses.map((expense) => (
              <li
                key={expense.id}
                className={`${isMobile ? "flex flex-col gap-3" : "flex items-center justify-between gap-4"} bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 rounded-lg p-3 transition-colors`}
              >
                <div className="flex-1 min-w-0">
                  <div className={`text-white font-medium mb-1 ${isMobile ? "text-sm" : ""}`}>{expense.description}</div>
                  <div className={`flex items-center gap-2 ${isMobile ? "text-xs" : "text-sm"}`}>
                    {expense.arsAmount && (
                      <span className="inline-flex items-center text-blue-400 font-medium">
                        <span className="text-blue-500 mr-0.5">ARS</span>
                        {expense.arsAmount.toLocaleString("es-AR")}
                      </span>
                    )}
                    {expense.arsAmount && expense.usdAmount && (
                      <span className="text-gray-600">•</span>
                    )}
                    {expense.usdAmount && (
                      <span className="inline-flex items-center text-emerald-400 font-medium">
                        <span className="text-emerald-500 mr-0.5">USD</span>
                        {expense.usdAmount.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => onAddExpense(expense)}
                  className={`bg-yellow-600 hover:bg-yellow-700 text-white shadow-md transition-all hover:shadow-lg ${isMobile ? "w-full" : "flex-shrink-0"}`}
                >
                  Add Expense
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
