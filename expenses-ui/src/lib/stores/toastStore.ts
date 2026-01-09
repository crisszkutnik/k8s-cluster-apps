import { create } from "zustand";

export const ToastType = {
  Success: "success",
  Error: "error",
  Warning: "warning",
  Info: "info",
} as const;

export type ToastType = (typeof ToastType)[keyof typeof ToastType];

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastStoreState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

let toastId = 0;

export const useToastStore = create<ToastStoreState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++toastId}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    const duration = toast.duration ?? 50000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export const toast = {
  success: (title: string, message?: string, duration?: number) => {
    useToastStore
      .getState()
      .addToast({ type: ToastType.Success, title, message, duration });
  },
  error: (title: string, message?: string, duration?: number) => {
    useToastStore
      .getState()
      .addToast({ type: ToastType.Error, title, message, duration });
  },
  warning: (title: string, message?: string, duration?: number) => {
    useToastStore
      .getState()
      .addToast({ type: ToastType.Warning, title, message, duration });
  },
  info: (title: string, message?: string, duration?: number) => {
    useToastStore
      .getState()
      .addToast({ type: ToastType.Info, title, message, duration });
  },
};
