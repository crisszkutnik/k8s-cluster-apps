import { useState, useEffect } from "react";
import { ArrowRightLeft, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Combobox } from "./ui/combobox";
import { useCategoryStore } from "../lib/stores/categoryStore";
import { useSubcategoryStore } from "../lib/stores/subcategoryStore";
import { usePaymentMethodStore } from "../lib/stores/paymentMethodStore";
import { editExpense, loadInsertData, type EditExpensePayload } from "../lib/service/insertData";
import { toast } from "../lib/stores/toastStore";
import type { Expense } from "../lib/types";

interface ExpenseFormData {
  description: string;
  arsAmount: string;
  usdAmount: string;
  date: string;
  paymentMethodId: string;
  categoryId: string;
  subcategoryId: string;
}

interface FormErrors {
  description?: string;
  amount?: string;
  date?: string;
  paymentMethodId?: string;
  categoryId?: string;
}

interface EditExpenseModalProps {
  expense: Expense;
  onExpenseUpdated?: () => void;
}

export function EditExpenseModal({ expense, onExpenseUpdated }: EditExpenseModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: "",
    arsAmount: "",
    usdAmount: "",
    date: "",
    paymentMethodId: "",
    categoryId: "",
    subcategoryId: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fxRate, setFxRate] = useState<number>(0);

  const { categories } = useCategoryStore();
  const { subcategories } = useSubcategoryStore();
  const { paymentMethods } = usePaymentMethodStore();

  const paymentMethodOptions = paymentMethods.map((pm) => ({
    value: pm.id,
    label: pm.name,
  }));

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const filteredSubcategories = subcategories.filter(
    (sub) => sub.categoryId === formData.categoryId
  );

  const subcategoryOptions = filteredSubcategories.map((sub) => ({
    value: sub.id,
    label: sub.name,
  }));

  useEffect(() => {
    if (open) {
      setFormData({
        description: expense.description,
        arsAmount: expense.arsAmount?.toString() ?? "",
        usdAmount: expense.usdAmount?.toString() ?? "",
        date: expense.date.split("T")[0],
        paymentMethodId: expense.paymentMethodId,
        categoryId: expense.categoryId,
        subcategoryId: expense.subcategoryId ?? "",
      });
      setErrors({});
      
      if (fxRate === 0) {
        loadInsertData().then((data) => {
          setFxRate(data.usdArsFx);
        });
      }
    }
  }, [open, expense]);

  useEffect(() => {
    if (formData.categoryId) {
      const hasSubcategories = subcategories.some(
        (sub) => sub.categoryId === formData.categoryId
      );
      if (!hasSubcategories) {
        setFormData((prev) => ({ ...prev, subcategoryId: "" }));
      }
    }
  }, [formData.categoryId, subcategories]);

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.arsAmount && !formData.usdAmount) {
      newErrors.amount = "At least one amount (ARS or USD) is required";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.paymentMethodId) {
      newErrors.paymentMethodId = "Payment method is required";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Category is required";
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload: EditExpensePayload = {
      id: expense.id,
      userId: expense.userId,
      description: formData.description.trim(),
      paymentMethodId: formData.paymentMethodId,
      arsAmount: formData.arsAmount ? parseFloat(formData.arsAmount) : undefined,
      usdAmount: formData.usdAmount ? parseFloat(formData.usdAmount) : undefined,
      categoryId: formData.categoryId,
      subcategoryId: formData.subcategoryId || undefined,
      recurrentExpenseId: expense.recurrentExpenseId,
      installementsExpenseId: expense.installementsExpenseId,
      date: formData.date,
    };

    setIsSubmitting(true);
    try {
      await editExpense(payload);
      toast.success("Expense updated", `"${payload.description}" was updated successfully.`);
      setOpen(false);
      if (onExpenseUpdated) {
        onExpenseUpdated();
      }
    } catch (error) {
      console.error("Failed to update expense:", error);
      toast.error("Failed to update expense", "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof ExpenseFormData>(
    field: K,
    value: ExpenseFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "description") clearError("description");
    if (field === "arsAmount" || field === "usdAmount") clearError("amount");
    if (field === "date") clearError("date");
    if (field === "paymentMethodId") clearError("paymentMethodId");
    if (field === "categoryId") clearError("categoryId");
  };

  const convertArsToUsd = () => {
    if (formData.arsAmount && fxRate > 0) {
      const usdValue = parseFloat(formData.arsAmount) / fxRate;
      updateField("usdAmount", usdValue.toFixed(2));
    }
  };

  const convertUsdToArs = () => {
    if (formData.usdAmount && fxRate > 0) {
      const arsValue = parseFloat(formData.usdAmount) * fxRate;
      updateField("arsAmount", arsValue.toFixed(2));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => setOpen(true)}
        title="Edit expense"
      >
        <Pencil size={16} />
      </Button>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>
            Update the details of this expense.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="What did you spend on?"
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label>Amounts</Label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>FX Rate:</span>
                <Input
                  type="number"
                  step="0.01"
                  value={fxRate}
                  onChange={(e) => setFxRate(parseFloat(e.target.value) || 0)}
                  className="w-24 h-7 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="arsAmount" className="flex-1">ARS Amount</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={convertArsToUsd}
                    disabled={!formData.arsAmount || fxRate === 0}
                    title="Convert ARS to USD"
                  >
                    <ArrowRightLeft size={14} />
                  </Button>
                </div>
                <Input
                  id="arsAmount"
                  type="number"
                  step="0.01"
                  value={formData.arsAmount}
                  onChange={(e) => updateField("arsAmount", e.target.value)}
                  placeholder="0.00"
                  className={errors.amount ? "border-destructive" : ""}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={convertUsdToArs}
                    disabled={!formData.usdAmount || fxRate === 0}
                    title="Convert USD to ARS"
                  >
                    <ArrowRightLeft size={14} />
                  </Button>
                  <Label htmlFor="usdAmount" className="flex-1">USD Amount</Label>
                </div>
                <Input
                  id="usdAmount"
                  type="number"
                  step="0.01"
                  value={formData.usdAmount}
                  onChange={(e) => updateField("usdAmount", e.target.value)}
                  placeholder="0.00"
                  className={errors.amount ? "border-destructive" : ""}
                />
              </div>
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => updateField("date", e.target.value)}
              className={errors.date ? "border-destructive" : ""}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Payment Method <span className="text-destructive">*</span>
            </Label>
            <Combobox
              options={paymentMethodOptions}
              value={formData.paymentMethodId}
              onValueChange={(value) => updateField("paymentMethodId", value)}
              placeholder="Select payment method..."
              searchPlaceholder="Search payment methods..."
              emptyText="No payment methods found."
              className={errors.paymentMethodId ? "border-destructive" : ""}
            />
            {errors.paymentMethodId && (
              <p className="text-sm text-destructive">
                {errors.paymentMethodId}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Category <span className="text-destructive">*</span>
            </Label>
            <Combobox
              options={categoryOptions}
              value={formData.categoryId}
              onValueChange={(value) => updateField("categoryId", value)}
              placeholder="Select category..."
              searchPlaceholder="Search categories..."
              emptyText="No categories found."
              className={errors.categoryId ? "border-destructive" : ""}
            />
            {errors.categoryId && (
              <p className="text-sm text-destructive">{errors.categoryId}</p>
            )}
          </div>

          {filteredSubcategories.length > 0 && (
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Combobox
                options={subcategoryOptions}
                value={formData.subcategoryId}
                onValueChange={(value) => updateField("subcategoryId", value)}
                placeholder="Select subcategory..."
                searchPlaceholder="Search subcategories..."
                emptyText="No subcategories found."
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
