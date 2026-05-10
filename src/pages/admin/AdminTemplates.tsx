import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { templatesApi } from "@/api/templates";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatDate } from "@/lib/format";
import type { ResumeTemplate } from "@/types";

export default function AdminTemplates() {
  const qc = useQueryClient();
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

      <div className="card">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900/40">
              <tr>
                <Th>Name</Th>
                <Th>Description</Th>
                <Th>Updated</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {list.isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 4 }).map((_, c) => (
                        <td key={c} className="px-4 py-3"><Skeleton /></td>
                      ))}
                    </tr>
                  ))
                : list.data?.data.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="px-4 py-3 font-medium">
                        <Link to={`/admin/templates/${t.id}`} className="hover:underline">
                          {t.name}
                        </Link>
                      </td>
                      <Td className="text-slate-500">{t.description ?? "—"}</Td>
                      <Td>{formatDate(t.updatedAt)}</Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/admin/templates/${t.id}`} className="btn-ghost">
                            Edit
                          </Link>
                          <Button variant="ghost" onClick={() => setTarget(t)}>
                            Delete
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  ))}
              {!list.isLoading && list.data?.data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No templates yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <th className={`px-4 py-3 text-left font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
