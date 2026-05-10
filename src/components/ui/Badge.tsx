import { cn } from "@/lib/cn";
import { ReactNode } from "react";
import type { GenerationStatus } from "@/types";

const variants = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export function Badge({
  variant = "neutral",
  children,
  className,
}: {
  variant?: keyof typeof variants;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: GenerationStatus }) {
  const map: Record<GenerationStatus, { v: keyof typeof variants; label: string }> = {
    PENDING: { v: "neutral", label: "Pending" },
    PROCESSING: { v: "info", label: "Processing" },
    COMPLETED: { v: "success", label: "Completed" },
    FAILED: { v: "danger", label: "Failed" },
  };
  const cfg = map[status];
  return <Badge variant={cfg.v}>{cfg.label}</Badge>;
}
