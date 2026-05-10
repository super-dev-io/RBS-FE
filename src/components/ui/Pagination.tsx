import { Button } from "./Button";

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  total?: number;
}

export function Pagination({ page, totalPages, onChange, total }: Props) {
  if (totalPages <= 1 && (total ?? 0) <= 0) return null;
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
      <span className="text-slate-500 dark:text-slate-400">
        Page <strong>{page}</strong> of <strong>{Math.max(totalPages, 1)}</strong>
        {total != null ? ` · ${total} total` : null}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Prev
        </Button>
        <Button variant="secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
