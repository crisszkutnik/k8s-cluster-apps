import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  useToastStore,
  ToastType,
  type Toast,
} from "../../lib/stores/toastStore";

const toastConfig: Record<
  ToastType,
  { icon: React.ReactNode; className: string; closeClassName: string }
> = {
  [ToastType.Success]: {
    icon: <CheckCircle className="h-5 w-5" />,
    className: "bg-green-950 border-green-800 text-green-100",
    closeClassName: "text-green-400 hover:text-green-200",
  },
  [ToastType.Error]: {
    icon: <AlertCircle className="h-5 w-5" />,
    className: "bg-red-950 border-red-800 text-red-100",
    closeClassName: "text-red-400 hover:text-red-200",
  },
  [ToastType.Warning]: {
    icon: <AlertTriangle className="h-5 w-5" />,
    className: "bg-yellow-950 border-yellow-800 text-yellow-100",
    closeClassName: "text-yellow-400 hover:text-yellow-200",
  },
  [ToastType.Info]: {
    icon: <Info className="h-5 w-5" />,
    className: "bg-blue-950 border-blue-800 text-blue-100",
    closeClassName: "text-blue-400 hover:text-blue-200",
  },
};

interface ToastProps {
  toast: Toast;
  onClose: () => void;
}

function Toast({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const config = toastConfig[toast.type];

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsLeaving(true);
    setTimeout(onClose, 200);
  };

  const stopPropagation = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-200 min-w-[320px] max-w-[420px] z-[999]",
        config.className,
        isVisible && !isLeaving
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-4"
      )}
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onKeyDown={stopPropagation}
    >
      <span className="shrink-0 mt-0.5">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.title}</p>
        {toast.message && (
          <p className="mt-1 text-sm opacity-90">{toast.message}</p>
        )}
      </div>
      <button
        onClick={handleClose}
        onMouseDown={stopPropagation}
        onKeyDown={stopPropagation}
        className={cn(
          "shrink-0 p-1 transition-colors -mr-1 -mt-1 bg-transparent border-none",
          config.closeClassName
        )}
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onClose={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>,
    document.body
  );
}
