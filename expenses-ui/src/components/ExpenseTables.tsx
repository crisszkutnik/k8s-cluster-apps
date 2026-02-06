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
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
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
      <Title>{title}</Title>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-blue-400 font-medium">
                description
              </th>
              <th className="text-left py-3 px-4 text-blue-400 font-medium">
                ars_amount
              </th>
              <th className="text-left py-3 px-4 text-blue-400 font-medium">
                usd_amount
              </th>
              <th className="text-left py-3 px-4 text-blue-400 font-medium">
                payment_method_name
              </th>
              <th className="text-left py-3 px-4 text-blue-400 font-medium">
                category_name
              </th>
              <th className="text-left py-3 px-4 text-blue-400 font-medium">
                date
              </th>
              <th className="text-right py-3 px-4 text-blue-400 font-medium">
                actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-b border-slate-800 hover:bg-slate-800/50"
                >
                  <td className="py-3 px-4 text-white">{expense.description}</td>
                  <td className="py-3 px-4 text-white">
                    {expense.arsAmount?.toLocaleString("es-AR") || "-"}
                  </td>
                  <td className="py-3 px-4 text-white">
                    {expense.usdAmount?.toFixed(2) || "-"}
                  </td>
                  <td className="py-3 px-4 text-white">
                    {expense.paymentMethodName}
                  </td>
                  <td className="py-3 px-4 text-white">
                    {expense.categoryName}
                  </td>
                  <td className="py-3 px-4 text-white">
                    {formatDate(expense.date)}
                  </td>
                  <td className="py-3 px-4 text-white">
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
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  No expenses to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-right text-sm text-gray-400">
        {rowCountLabel}
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

      <div className={isMobile ? "space-y-6" : "grid grid-cols-2 gap-6"}>
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
    </div>
  );
}

