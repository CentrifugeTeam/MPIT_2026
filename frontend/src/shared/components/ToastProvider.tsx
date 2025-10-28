import { AnimatePresence, motion } from "framer-motion";
import { useToastStore } from "../hooks/useToast";
import type { Toast } from "../hooks/useToast";

const ToastItem = ({ toast }: { toast: Toast }) => {
  const { removeToast } = useToastStore();

  const getToastStyles = (type: Toast["type"]) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-success/10 dark:bg-success/20",
          border: "border-success",
          icon: "✓",
          iconBg: "bg-success",
        };
      case "error":
        return {
          bg: "bg-danger/10 dark:bg-danger/20",
          border: "border-danger",
          icon: "✕",
          iconBg: "bg-danger",
        };
      case "warning":
        return {
          bg: "bg-warning/10 dark:bg-warning/20",
          border: "border-warning",
          icon: "⚠",
          iconBg: "bg-warning",
        };
      case "info":
        return {
          bg: "bg-primary/10 dark:bg-primary/20",
          border: "border-primary",
          icon: "ℹ",
          iconBg: "bg-primary",
        };
    }
  };

  const styles = getToastStyles(toast.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`
        flex items-start gap-3 p-4 rounded-lg border-2
        ${styles.bg} ${styles.border}
        shadow-lg backdrop-blur-sm
        min-w-[320px] max-w-[500px]
      `}
    >
      {/* Icon */}
      <div
        className={`
          flex items-center justify-center
          w-6 h-6 rounded-full
          ${styles.iconBg} text-white
          shrink-0 font-bold text-sm
        `}
      >
        {styles.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground mb-0.5">{toast.title}</h4>
        {toast.message && (
          <p className="text-sm text-foreground/70">{toast.message}</p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => removeToast(toast.id)}
        className="
          shrink-0 text-foreground/50 hover:text-foreground
          transition-colors duration-200
          text-lg leading-none
        "
        aria-label="Close notification"
      >
        ×
      </button>
    </motion.div>
  );
};

export const ToastProvider = () => {
  const { toasts } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-9999 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};
