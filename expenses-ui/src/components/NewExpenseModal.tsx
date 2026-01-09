import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
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
import { useCategoryStore } from "../lib/stores/categoryStore";
import { useSubcategoryStore } from "../lib/stores/subcategoryStore";
import { usePaymentMethodStore } from "../lib/stores/paymentMethodStore";
import { useRecurrentExpenseStore } from "../lib/stores/recurrentExpenseStore";
import { insertData, type NewExpensePayload } from "../lib/service/insertData";
import { toast } from "../lib/stores/toastStore";

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

const initialFormData: ExpenseFormData = {
  description: "",
  arsAmount: "",
  usdAmount: "",
  date: new Date().toISOString().split("T")[0],
  paymentMethodId: "",
  categoryId: "",
  subcategoryId: "",
};

export function NewExpenseModal() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormData>(initialFormData);
  const [selectedRecurrentId, setSelectedRecurrentId] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    (sub) => sub.categoryId === formData.categoryId
  );

  const subcategoryOptions = filteredSubcategories.map((sub) => ({
    value: sub.id,
    label: sub.name,
  }));

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData(initialFormData);
      setSelectedRecurrentId("");
      setErrors({});
    }
  }, [open]);

  // Reset subcategory when category changes
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
      setFormData(initialFormData);
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
      });
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

    const payload: NewExpensePayload = {
      description: formData.description.trim(),
      paymentMethodId: formData.paymentMethodId,
      arsAmount: formData.arsAmount ? parseFloat(formData.arsAmount) : 0,
      usdAmount: formData.usdAmount ? parseFloat(formData.usdAmount) : 0,
      categoryId: formData.categoryId,
      subcategoryId: formData.subcategoryId || undefined,
      recurrentExpenseId: selectedRecurrentId || undefined,
      date: formData.date,
    };

    setIsSubmitting(true);
    try {
      await insertData(payload);
      toast.success("Expense added", `"${payload.description}" was added successfully.`);
      setOpen(false);
    } catch (error) {
      console.error("Failed to insert expense:", error);
      toast.error("Failed to add expense", "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof ExpenseFormData>(
    field: K,
    value: ExpenseFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear related errors
    if (field === "description") clearError("description");
    if (field === "arsAmount" || field === "usdAmount") clearError("amount");
    if (field === "date") clearError("date");
    if (field === "paymentMethodId") clearError("paymentMethodId");
    if (field === "categoryId") clearError("categoryId");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2">
          <Plus size={18} />
          New expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Expense</DialogTitle>
          <DialogDescription>
            Add a new expense or select from a recurrent expense.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recurrent Expense Selection */}
          {recurrentExpenses.length > 0 && (
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

          {/* Amounts */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="arsAmount">ARS Amount</Label>
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
                <Label htmlFor="usdAmount">USD Amount</Label>
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
