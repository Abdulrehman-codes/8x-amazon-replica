"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, X } from "lucide-react";

export type Toast = {
  id: number;
  title: string;
  body?: string;
  image?: string;
  href?: string;
  hrefLabel?: string;
};

type ToastInput = Omit<Toast, "id">;

const ToastContext = createContext<(toast: ToastInput) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: ToastInput) => {
      const id = nextId.current++;
      // Only ever one on screen: a stack of confirmations is noise, not news.
      setToasts([{ ...toast, id }]);
      setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-4 sm:justify-end sm:pr-5"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-slide-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border border-border bg-surface p-3 shadow-[0_12px_40px_rgba(15,23,42,0.18)]"
          >
            {toast.image ? (
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-canvas">
                <Image
                  src={toast.image}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-contain"
                />
              </span>
            ) : (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-success text-white">
                <Check size={16} strokeWidth={3} />
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
                <Check size={14} strokeWidth={3} />
                {toast.title}
              </p>
              {toast.body && (
                <p className="mt-0.5 line-clamp-2-safe text-xs text-fg-muted">
                  {toast.body}
                </p>
              )}
              {toast.href && (
                <Link
                  href={toast.href}
                  className="mt-1.5 inline-block text-xs font-semibold text-link hover:text-link-hover"
                >
                  {toast.hrefLabel ?? "View"}
                </Link>
              )}
            </div>

            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="shrink-0 rounded p-1 text-fg-subtle transition hover:bg-canvas"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
