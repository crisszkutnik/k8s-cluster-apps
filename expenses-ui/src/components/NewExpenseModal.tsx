import { useState, useEffect } from "react";
import { Plus, ArrowRightLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Combobox } from "./ui/combobox";
import { cn } from "../lib/utils";
import { useCategoryStore } from "../lib/stores/categoryStore";
import { useSubcategoryStore } from "../lib/stores/subcategoryStore";
import { usePaymentMethodStore } from "../lib/stores/paymentMethodStore";
import { useRecurrentExpenseStore } from "../lib/stores/recurrentExpenseStore";
import {
  insertData,
  loadInsertData,
  type NewExpensePayload,
} from "../lib/service/insertData";
import { toast } from "../lib/stores/toastStore";

type ExpenseType = "individual" | "recurrent" | "installment";
type InstallmentAmountType = "total" | "perInstallment";

interface ExpenseFormData {
  description: string;
  arsAmount: string;
  usdAmount: string;
  date: string;
  paymentMethodId: string;
  categoryId: string;
  subcategoryId: string;
  installmentMonths: string;
}

interface FormErrors {
  description?: string;
  amount?: string;
  date?: string;
  paymentMethodId?: string;
  categoryId?: string;
  installmentMonths?: string;
}

const buildInitialFormData = (defaultCategoryId?: string, defaultSubcategoryId?: string): ExpenseFormData => ({
  description: "",
  arsAmount: "",
  usdAmount: "",
  date: new Date().toISOString().split("T")[0],
  paymentMethodId: "",
  categoryId: defaultCategoryId ?? "",
  subcategoryId: defaultSubcategoryId ?? "",
  installmentMonths: "",
});

interface NewExpenseModalProps {
  defaultCategoryId?: string;
  defaultSubcategoryId?: string;
  defaultRecurrentExpenseId?: string;
  onSuccess?: () => void;
  compact?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewExpenseModal({
  defaultCategoryId,
  defaultSubcategoryId,
  defaultRecurrentExpenseId,
  onSuccess,
  compact,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: NewExpenseModalProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;
  const [expenseType, setExpenseType] = useState<ExpenseType>("individual");
  const [installmentAmountType, setInstallmentAmountType] = useState<InstallmentAmountType>("total");
  const [formData, setFormData] = useState<ExpenseFormData>(() =>
    buildInitialFormData(defaultCategoryId, defaultSubcategoryId),
  );
  const [selectedRecurrentId, setSelectedRecurrentId] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fxRate, setFxRate] = useState<number>(0);

  const { categories } = useCategoryStore();
  const { subcategories } = useSubcategoryStore();
  const { paymentMethods } = usePaymentMethodStore();
  const { recurrentExpenses } = useRecurrentExpenseStore();

  // Derive options directly - no need for useMemo since these are simple transforms
  const recurrentOptions = recurrentExpenses.map((r) => ({
    value: r.id,
    label: r.description,
  }));

  const paymentMethodOptions = paymentMethods.map((pm) => ({
    value: pm.id,
    label: pm.name,
  }));

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const filteredSubcategories = subcategories.filter(
    (sub) => sub.categoryId === formData.categoryId,
  );

  const subcategoryOptions = filteredSubcategories.map((sub) => ({
    value: sub.id,
    label: sub.name,
  }));

  useEffect(() => {
    if (!open) {
      setFormData(buildInitialFormData(defaultCategoryId, defaultSubcategoryId));
      setSelectedRecurrentId("");
      setExpenseType("individual");
      setInstallmentAmountType("total");
      setErrors({});
    } else if (defaultRecurrentExpenseId) {
      setExpenseType("recurrent");
      setSelectedRecurrentId(defaultRecurrentExpenseId);
      setErrors({});

      const recurrent = recurrentExpenses.find((r) => r.id === defaultRecurrentExpenseId);
      if (recurrent) {
        setFormData({
          description: recurrent.description,
          arsAmount: recurrent.arsAmount?.toString() ?? "",
          usdAmount: recurrent.usdAmount?.toString() ?? "",
          date: new Date().toISOString().split("T")[0],
          paymentMethodId: recurrent.paymentMethodId,
          categoryId: recurrent.categoryId,
          subcategoryId: recurrent.subcategoryId ?? "",
          installmentMonths: "",
        });
      }
    }
  }, [open, defaultCategoryId, defaultSubcategoryId, defaultRecurrentExpenseId, recurrentExpenses]);

  useEffect(() => {
    if (open && fxRate === 0) {
      loadInsertData().then((data) => {
        setFxRate(data.usdArsFx);
      });
    }
  }, [open, fxRate]);

  // Reset subcategory when category changes
  useEffect(() => {
    if (formData.categoryId) {
      const hasSubcategories = subcategories.some(
        (sub) => sub.categoryId === formData.categoryId,
      );
      if (!hasSubcategories) {
        setFormData((prev) => ({ ...prev, subcategoryId: "" }));
      }
    }
  }, [formData.categoryId, subcategories]);

  // Clear specific error when field is updated
  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRecurrentSelect = (recurrentId: string) => {
    setSelectedRecurrentId(recurrentId);
    setErrors({});

    if (!recurrentId) {
      setFormData(buildInitialFormData(defaultCategoryId));
      return;
    }

    const recurrent = recurrentExpenses.find((r) => r.id === recurrentId);
    if (recurrent) {
      setFormData({
        description: recurrent.description,
        arsAmount: recurrent.arsAmount?.toString() ?? "",
        usdAmount: recurrent.usdAmount?.toString() ?? "",
        date: new Date().toISOString().split("T")[0],
        paymentMethodId: recurrent.paymentMethodId,
        categoryId: recurrent.categoryId,
        subcategoryId: recurrent.subcategoryId ?? "",
        installmentMonths: "",
      });
    }
  };

  const handleExpenseTypeChange = (type: ExpenseType) => {
    setExpenseType(type);
    // Clear recurrent selection when switching away from recurrent type
    if (type !== "recurrent") {
      setSelectedRecurrentId("");
    }
    setErrors({});
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.arsAmount || !formData.usdAmount) {
      newErrors.amount = "Both ARS and USD amounts are required";
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

    if (expenseType === "installment") {
      if (!formData.installmentMonths || parseInt(formData.installmentMonths) < 1) {
        newErrors.installmentMonths = "Number of installments must be at least 1";
      }
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

    const installmentMonths = expenseType === "installment" && formData.installmentMonths
      ? parseInt(formData.installmentMonths)
      : undefined;

    const arsAmount = parseFloat(formData.arsAmount) || 0;
    const usdAmount = parseFloat(formData.usdAmount) || 0;

    const finalArsAmount = expenseType === "installment" && installmentAmountType === "perInstallment" && installmentMonths
      ? arsAmount * installmentMonths
      : arsAmount;
    const finalUsdAmount = expenseType === "installment" && installmentAmountType === "perInstallment" && installmentMonths
      ? usdAmount * installmentMonths
      : usdAmount;

    const payload: NewExpensePayload = {
      description: formData.description.trim(),
      paymentMethodId: formData.paymentMethodId,
      arsAmount: finalArsAmount,
      usdAmount: finalUsdAmount,
      categoryId: formData.categoryId,
      subcategoryId: formData.subcategoryId || undefined,
      recurrentExpenseId: selectedRecurrentId || undefined,
      date: formData.date,
      ...(installmentMonths && { installmentMonths }),
    };

    setIsSubmitting(true);
    try {
      await insertData(payload);
      toast.success(
        "Expense added",
        `"${payload.description}" was added successfully.`,
      );
      onSuccess?.();
      setOpen(false);
    } catch (error) {
      console.error("Failed to insert expense:", error);
      toast.error(
        "Failed to add expense",
        "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof ExpenseFormData>(
    field: K,
    value: ExpenseFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "description") clearError("description");
    if (field === "arsAmount" || field === "usdAmount") clearError("amount");
    if (field === "date") clearError("date");
    if (field === "paymentMethodId") clearError("paymentMethodId");
    if (field === "categoryId") clearError("categoryId");
    if (field === "installmentMonths") clearError("installmentMonths");
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
      <DialogTrigger asChild>
        <Button className={compact ? "gap-2" : "w-full gap-2"}>
          <Plus size={18} />
          New expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Expense</DialogTitle>
          <DialogDescription>
            Add an individual expense, create from a recurrent expense, or set up an installment expense.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Expense Type Selection */}
          <div className="space-y-3">
            <Label>Expense Type</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleExpenseTypeChange("individual")}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  expenseType === "individual"
                    ? "bg-muted text-foreground border border-muted-foreground/40"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-transparent"
                )}
              >
                Individual Expense
              </button>
              <button
                type="button"
                onClick={() => handleExpenseTypeChange("recurrent")}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  expenseType === "recurrent"
                    ? "bg-muted text-foreground border border-muted-foreground/40"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-transparent"
                )}
              >
                Recurrent Expense
              </button>
              <button
                type="button"
                onClick={() => handleExpenseTypeChange("installment")}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  expenseType === "installment"
                    ? "bg-muted text-foreground border border-muted-foreground/40"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-transparent"
                )}
              >
                Installment Expense
              </button>
            </div>
          </div>

          {expenseType === "installment" && (
            <div className="space-y-2">
              <Label htmlFor="installmentMonths">
                Number of Installments <span className="text-destructive">*</span>
              </Label>
              <Input
                id="installmentMonths"
                type="number"
                min="1"
                value={formData.installmentMonths}
                onChange={(e) => updateField("installmentMonths", e.target.value)}
                placeholder="Enter number of months"
                className={errors.installmentMonths ? "border-destructive" : ""}
              />
              {errors.installmentMonths && (
                <p className="text-sm text-destructive">{errors.installmentMonths}</p>
              )}
            </div>
          )}

          {expenseType === "recurrent" && recurrentExpenses.length > 0 && (
            <div className="space-y-2">
              <Label>Recurrent Expense (optional)</Label>
              <Combobox
                options={recurrentOptions}
                value={selectedRecurrentId}
                onValueChange={handleRecurrentSelect}
                placeholder="Select recurrent expense..."
                searchPlaceholder="Search recurrent expenses..."
                emptyText="No recurrent expenses found."
              />
            </div>
          )}

          {/* Description */}
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

          {expenseType === "installment" && (
            <div className="space-y-2">
              <Label>Amount Type</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInstallmentAmountType("total")}
                  className={cn(
                    "flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    installmentAmountType === "total"
                      ? "bg-muted text-foreground border border-muted-foreground/40"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-transparent"
                  )}
                >
                  Total Amount
                </button>
                <button
                  type="button"
                  onClick={() => setInstallmentAmountType("perInstallment")}
                  className={cn(
                    "flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    installmentAmountType === "perInstallment"
                      ? "bg-muted text-foreground border border-muted-foreground/40"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-transparent"
                  )}
                >
                  Per Installment
                </button>
              </div>
            </div>
          )}

          {/* Amounts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label>
                Amounts
                {expenseType === "installment" && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({installmentAmountType === "total" ? "Total" : "Per Installment"})
                  </span>
                )}
              </Label>
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
                  <Label htmlFor="arsAmount" className="flex-1">
                    ARS Amount
                  </Label>
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
                  <Label htmlFor="usdAmount" className="flex-1">
                    USD Amount
                  </Label>
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

          {/* Date */}
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

          {/* Payment Method */}
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

          {/* Category */}
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

          {/* Subcategory - only show if category has subcategories */}
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
              {isSubmitting ? "Adding..." : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
