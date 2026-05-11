import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { KebabIcon } from "./Icons";

export interface EntityCardBadge {
  label: string;
  tone?: "default" | "accent" | "muted";
}

export interface EntityCardAction {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

export interface EntityCardProps {
  leading: React.ReactNode;
  title: string;
  subtitle?: string;
  badges?: EntityCardBadge[];
  onClick?: () => void;
  actions?: EntityCardAction[];
  className?: string;
}

const toneClass: Record<NonNullable<EntityCardBadge["tone"]>, string> = {
  default:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  accent:
    "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
  muted: "bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400",
};

export function EntityCard({
  leading,
  title,
  subtitle,
  badges,
  onClick,
  actions,
  className,
}: EntityCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "card group relative flex flex-col gap-3 p-5",
        onClick &&
          "cursor-pointer transition hover:border-brand-400 hover:shadow-md",
        className
      )}
    >
      {actions && actions.length > 0 && (
        <ActionMenu actions={actions} />
      )}
      <div className="flex items-start gap-3">
        <div className="shrink-0">{leading}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </div>
          {subtitle && (
            <div className="truncate text-xs text-slate-500">{subtitle}</div>
          )}
        </div>
      </div>
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((b, i) => (
            <span
              key={i}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                toneClass[b.tone ?? "default"]
              )}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionMenu({ actions }: { actions: EntityCardAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="absolute right-3 top-3 z-10" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label="Actions"
        onClick={() => setOpen((o) => !o)}
        className="rounded p-1 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 focus:opacity-100 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        <KebabIcon />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 min-w-[140px] overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {actions.map((a, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setOpen(false);
                a.onClick();
              }}
              className={cn(
                "block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800",
                a.destructive
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-700 dark:text-slate-200"
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
