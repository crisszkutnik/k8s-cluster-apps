import { useMemo } from "react";
import { Card, Title } from "@tremor/react";
import { categorizeExpenses } from "../lib/utils";
import type { Expense } from "../lib/types";
import { useIsMobile } from "../hooks/use-mobile";
import { EditExpenseModal } from "./EditExpenseModal";
import { DeleteExpenseDialog } from "./DeleteExpenseDialog";

interface ExpenseTablesProps {
  expenses: Expense[];
  categories: Array<{
    id: string;
    name: string;
  }>;
  paymentMethods: Array<{
    id: string;
    name: string;
  }>;
  onExpenseUpdated?: () => void;
}

interface EnrichedExpense extends Expense {
  categoryName: string;
  paymentMethodName: string;
}

export function ExpenseTables({
  expenses,
  categories,
  paymentMethods,
  onExpenseUpdated,
}: ExpenseTablesProps) {
  const isMobile = useIsMobile();

  const { monthly, installments, recurrent } = useMemo(
    () => categorizeExpenses(expenses),
    [expenses]
  );

  const enrichExpense = (expense: Expense): EnrichedExpense => {
    const category = categories.find((c) => c.id === expense.categoryId);
    const paymentMethod = paymentMethods.find(
      (pm) => pm.id === expense.paymentMethodId
    );

    return {
      ...expense,
      categoryName: category?.name || "Unknown",
      paymentMethodName: paymentMethod?.name || "Unknown",
    };
  };

  const enrichedMonthly = useMemo(
    () => monthly.map(enrichExpense),
    [monthly, categories, paymentMethods]
  );

  const enrichedInstallments = useMemo(
    () => installments.map(enrichExpense),
    [installments, categories, paymentMethods]
  );

  const enrichedRecurrent = useMemo(
    () => recurrent.map(enrichExpense),
    [recurrent, categories, paymentMethods]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const day = date.getDate();
    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return { month, day, time };
  };

  const TableComponent = ({
    title,
    data,
    rowCountLabel,
  }: {
    title: string;
    data: EnrichedExpense[];
    rowCountLabel: string;
  }) => (
    <Card className="bg-slate-900 border border-slate-800 rounded-lg">
      <Title className="text-lg font-semibold">{title}</Title>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-blue-400 font-semibold text-xs uppercase tracking-wider">
                Description
              </th>
              <th className="text-left py-3 px-4 text-blue-400 font-semibold text-xs uppercase tracking-wider">
                ARS
              </th>
              <th className="text-left py-3 px-4 text-blue-400 font-semibold text-xs uppercase tracking-wider">
                USD
              </th>
              <th className="text-left py-3 px-4 text-blue-400 font-semibold text-xs uppercase tracking-wider">
                Payment
              </th>
              <th className="text-left py-3 px-4 text-blue-400 font-semibold text-xs uppercase tracking-wider">
                Category
              </th>
              <th className="text-left py-3 px-4 text-blue-400 font-semibold text-xs uppercase tracking-wider">
                Date
              </th>
              <th className="text-right py-3 px-4 text-blue-400 font-semibold text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((expense) => {
                const dateInfo = formatDate(expense.date);
                return (
                  <tr
                    key={expense.id}
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="text-white font-medium">{expense.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      {expense.arsAmount ? (
                        <span className="text-blue-400 font-medium">
                          ARS {expense.arsAmount.toLocaleString("es-AR")}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {expense.usdAmount ? (
                        <span className="text-emerald-400 font-medium">
                          USD {expense.usdAmount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/30 text-purple-300 border border-purple-700/50">
                        {expense.paymentMethodName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-700/50">
                        {expense.categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-700/50 text-slate-200 border border-slate-600">
                          {dateInfo.month} {dateInfo.day}
                        </span>
                        <span className="text-xs text-gray-400">{dateInfo.time}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <EditExpenseModal
                          expense={expense}
                          onExpenseUpdated={onExpenseUpdated}
                        />
                        <DeleteExpenseDialog
                          expense={expense}
                          onExpenseDeleted={onExpenseUpdated}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-gray-500 text-sm">No expenses to display</div>
                    <div className="text-gray-600 text-xs">Add your first expense to get started</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
        <span className="text-sm text-gray-400">{rowCountLabel}</span>
        {data.length > 0 && (
          <div className="text-sm text-gray-500">
            Total: {data.length > 1 ? `${data.length} expenses` : '1 expense'}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <TableComponent
        title="Monthly expenses table"
        data={enrichedMonthly}
        rowCountLabel={`${enrichedMonthly.length} rows`}
      />

      <TableComponent
        title="Monthly installments table"
        data={enrichedInstallments}
        rowCountLabel={`${enrichedInstallments.length} rows`}
      />

      <TableComponent
        title="Monthly fixed table"
        data={enrichedRecurrent}
        rowCountLabel={`${enrichedRecurrent.length} rows`}
      />
    </div>
  );
}

