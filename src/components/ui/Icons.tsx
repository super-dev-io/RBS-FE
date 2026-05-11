import { cn } from "@/lib/cn";

interface IconProps {
  className?: string;
}

export function FolderIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("h-8 w-8 shrink-0 text-amber-500", className)}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z" />
    </svg>
  );
}

export function PdfIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("h-5 w-5 shrink-0 text-red-500", className)}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("h-8 w-8 shrink-0 text-sky-500", className)}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM4 22a8 8 0 0 1 16 0H4z" />
    </svg>
  );
}

export function ProfileIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("h-8 w-8 shrink-0 text-violet-500", className)}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="12" cy="10" r="3" fill="white" />
      <path d="M7 18a5 5 0 0 1 10 0" stroke="white" strokeWidth="2" fill="none" />
    </svg>
  );
}

export function TemplateIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("h-8 w-8 shrink-0 text-emerald-500", className)}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <rect x="3" y="3" width="18" height="4" rx="1" />
      <rect x="3" y="9" width="8" height="12" rx="1" />
      <rect x="13" y="9" width="8" height="6" rx="1" />
      <rect x="13" y="17" width="8" height="4" rx="1" />
    </svg>
  );
}

export function KebabIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("h-5 w-5 shrink-0", className)}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200",
        className
      )}
    >
      {initials || "?"}
    </div>
  );
}
