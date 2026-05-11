import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { templatesApi } from "@/api/templates";
import { tokenStore, getApiUrl } from "@/api/client";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { TemplateIcon, KebabIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";
import type { ResumeTemplate } from "@/types";

export default function AdminTemplates() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<ResumeTemplate | null>(null);

  const list = useQuery({
    queryKey: ["admin", "templates", { page, search }],
    queryFn: () => templatesApi.list({ page, pageSize: 20, search: search || undefined }),
  });

  const remove = useMutation({
    mutationFn: templatesApi.remove,
    onSuccess: () => {
      toast.success("Template deleted");
      qc.invalidateQueries({ queryKey: ["admin", "templates"] });
      setTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed"),
  });

  return (
    <>
      <PageHeader
        title="Templates"
        description="HTML/CSS resume templates rendered to PDF for every generation."
        actions={<Link to="/admin/templates/new" className="btn-primary">New template</Link>}
      />

      <div className="mb-4 flex items-center gap-3">
        <Input
          placeholder="Search by name…"
          className="max-w-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {list.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : list.data?.data.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-slate-500">
          No templates yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.data?.data.map((t) => {
            const usedBy = t._count?.defaultForProfiles ?? 0;
            return (
              <TemplateCard
                key={t.id}
                template={t}
                usedBy={usedBy}
                onEdit={() => navigate(`/admin/templates/${t.id}`)}
                onDelete={() => setTarget(t)}
              />
            );
          })}
        </div>
      )}

      <div className="mt-4">
        <Pagination
          page={page}
          totalPages={list.data?.pagination.totalPages ?? 1}
          total={list.data?.pagination.total}
          onChange={setPage}
        />
      </div>

      <ConfirmDialog
        open={!!target}
        onCancel={() => setTarget(null)}
        onConfirm={() => target && remove.mutate(target.id)}
        title="Delete template?"
        message={`Delete "${target?.name}"? Profiles using it will fall back to no default. Past generations remain intact.`}
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
      />
    </>
  );
}

function TemplateCard({
  template,
  usedBy,
  onEdit,
  onDelete,
}: {
  template: ResumeTemplate;
  usedBy: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card group relative flex flex-col overflow-hidden p-0 transition hover:border-brand-400 hover:shadow-md">
      <CardMenu onEdit={onEdit} onDelete={onDelete} />
      <button
        type="button"
        onClick={onEdit}
        className="block w-full text-left"
      >
        <TemplateThumbnail templateId={template.id} />
      </button>
      <div className="space-y-2 p-4">
        <div>
          <div className="truncate font-semibold text-slate-800 dark:text-slate-100">
            {template.name}
          </div>
          <div className="truncate text-xs text-slate-500">
            {template.description ?? "No description"}
          </div>
        </div>
        <div>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              usedBy === 0
                ? "bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                : "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
            )}
          >
            {usedBy === 0 ? "Not in use" : `Used by ${usedBy} profile${usedBy === 1 ? "" : "s"}`}
          </span>
        </div>
      </div>
    </div>
  );
}

function CardMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
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
    <div ref={ref} className="absolute right-3 top-3 z-10">
      <button
        type="button"
        aria-label="Actions"
        onClick={() => setOpen((o) => !o)}
        className="rounded bg-white/90 p-1 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-800 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:bg-slate-900"
      >
        <KebabIcon />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 min-w-[120px] overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => { setOpen(false); onEdit(); }}
            className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete(); }}
            className="block w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-slate-50 dark:text-red-400 dark:hover:bg-slate-800"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function TemplateThumbnail({ templateId }: { templateId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "template-thumbnail", templateId],
    queryFn: async () => {
      const token = tokenStore.getAccess();
      const res = await fetch(`${getApiUrl()}/admin/templates/${templateId}/thumbnail.png`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Failed to load thumbnail");
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Skeleton className="h-3/4 w-3/4" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <TemplateIcon className="h-16 w-16" />
      </div>
    );
  }
  return (
    <img
      src={data}
      alt="Template thumbnail"
      className="aspect-[4/3] w-full bg-white object-cover object-top"
    />
  );
}
