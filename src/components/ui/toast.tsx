"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type ToastVariant = "info" | "success" | "error";

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (options: { title: string; description?: string; variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mount guard for createPortal target
    // eslint-disable-next-line react-hooks/set-state-in-effect -- portal requires mounted DOM
    setMounted(true);
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "info" }: { title: string; description?: string; variant?: ToastVariant }) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "rounded-md border px-4 py-3 shadow-lg transition-all bg-background text-foreground",
                  t.variant === "success" && "border-emerald-500 bg-emerald-500/10 text-emerald-200",
                  t.variant === "error" && "border-destructive bg-destructive/10 text-destructive",
                  t.variant === "info" && "border-muted bg-muted/80 text-foreground"
                )}
              >
                <p className="font-pixel text-xs">{t.title}</p>
                {t.description && <p className="mt-1 text-[11px] text-muted-foreground">{t.description}</p>}
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

