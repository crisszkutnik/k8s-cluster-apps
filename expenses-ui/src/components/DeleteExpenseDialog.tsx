import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { deleteExpense } from "../lib/service/insertData";
import { toast } from "../lib/stores/toastStore";
import type { Expense } from "../lib/types";

interface DeleteExpenseDialogProps {
  expense: Expense;
  onExpenseDeleted?: () => void;
}

export function DeleteExpenseDialog({ expense, onExpenseDeleted }: DeleteExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExpense(expense.id);
      toast.success("Expense deleted", `"${expense.description}" was deleted successfully.`);
      setOpen(false);
      if (onExpenseDeleted) {
        onExpenseDeleted();
      }
    } catch (error) {
      console.error("Failed to delete expense:", error);
      toast.error("Failed to delete expense", "Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
        title="Delete expense"
      >
        <Trash2 size={16} />
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Expense</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this expense? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Description:</span> {expense.description}
            </div>
            {expense.arsAmount && (
              <div>
                <span className="font-medium">ARS Amount:</span> {expense.arsAmount.toLocaleString("es-AR")}
              </div>
            )}
            {expense.usdAmount && (
              <div>
                <span className="font-medium">USD Amount:</span> {expense.usdAmount.toFixed(2)}
              </div>
            )}
            <div>
              <span className="font-medium">Date:</span> {new Date(expense.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
