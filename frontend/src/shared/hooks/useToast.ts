import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Автоматически удаляем toast через указанное время (по умолчанию 5 секунд)
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearAllToasts: () => set({ toasts: [] }),
}));

export const useToast = () => {
  const { addToast, removeToast, clearAllToasts } = useToastStore();

  return {
    toast: {
      success: (title: string, message?: string, duration?: number) =>
        addToast({ type: "success", title, message, duration }),
      error: (title: string, message?: string, duration?: number) =>
        addToast({ type: "error", title, message, duration }),
      warning: (title: string, message?: string, duration?: number) =>
        addToast({ type: "warning", title, message, duration }),
      info: (title: string, message?: string, duration?: number) =>
        addToast({ type: "info", title, message, duration }),
    },
    removeToast,
    clearAllToasts,
  };
};

export { useToastStore };
