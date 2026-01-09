export interface Category {
  id: string;
  userId: string;
  name: string;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  name: string;
}

export interface RecurrentExpense {
  id: string;
  userId: string;
  description: string;
  paymentMethodId: string;
  arsAmount?: number;
  usdAmount?: number;
  categoryId: string;
  subcategoryId?: string;
  startDate: string;
  endDate?: string;
  createdDate: string;
}

export interface Expense {
  id: string;
  userId: string;
  description: string;
  paymentMethodId: string;
  arsAmount?: number;
  usdAmount?: number;
  categoryId: string;
  subcategoryId?: string;
  recurrentExpenseId?: string;
  installementsExpenseId?: string;
  date: string;
  createdDate: string;
}
