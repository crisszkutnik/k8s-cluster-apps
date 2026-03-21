import { useState } from "react";
import { Plus } from "lucide-react";
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
import { createPaymentMethod } from "../lib/service/paymentMethodService";
import { toast } from "../lib/stores/toastStore";
import type { PaymentMethod } from "../lib/types";

interface NewPaymentMethodModalProps {
  onCreated: (paymentMethod: PaymentMethod) => void;
}

export function NewPaymentMethodModal({ onCreated }: NewPaymentMethodModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleOpen = () => {
    setName("");
    setError(undefined);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const pm = await createPaymentMethod(name.trim());
      onCreated(pm);
      toast.success("Payment method created", `"${name.trim()}" was created successfully.`);
      setOpen(false);
    } catch (err) {
      console.error("Failed to create payment method:", err);
      toast.error("Failed to create payment method", "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={handleOpen} className="flex items-center gap-2">
        <Plus size={16} />
        Add Payment Method
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New Payment Method</DialogTitle>
          <DialogDescription>Add a new payment method to your account.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="new-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(undefined);
              }}
              placeholder="e.g. Visa, Cash, Mercado Pago"
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
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
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
