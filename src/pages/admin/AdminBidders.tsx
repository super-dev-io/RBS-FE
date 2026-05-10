import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { biddersApi } from "@/api/bidders";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import type { Bidder } from "@/types";

interface CreateForm {
  name: string;
  email: string;
  password: string;
}

interface UpdateForm {
  name: string;
  isActive: boolean;
  password?: string;
}

export default function AdminBidders() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Bidder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bidder | null>(null);

  const list = useQuery({
    queryKey: ["admin", "bidders", { page, search }],
    queryFn: () => biddersApi.list({ page, pageSize: 20, search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: biddersApi.create,
    onSuccess: () => {
      toast.success("Bidder created");
      qc.invalidateQueries({ queryKey: ["admin", "bidders"] });
      setCreateOpen(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed to create"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateForm }) => biddersApi.update(id, input),
    onSuccess: () => {
      toast.success("Bidder updated");
      qc.invalidateQueries({ queryKey: ["admin", "bidders"] });
      setEditTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: biddersApi.remove,
    onSuccess: () => {
      toast.success("Bidder deleted");
      qc.invalidateQueries({ queryKey: ["admin", "bidders"] });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed to delete"),
  });

  return (
    <>
      <PageHeader
        title="Bidders"
        description="Create accounts for the bidders that work resumes for you."
        actions={<Button onClick={() => setCreateOpen(true)}>New bidder</Button>}
      />

      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <Input
            placeholder="Search by name or email…"
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
                <Th>Email</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {list.isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, c) => (
                        <td key={c} className="px-4 py-3">
                          <Skeleton />
                        </td>
                      ))}
                    </tr>
                  ))
                : list.data?.data.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <Td className="font-medium">{b.name}</Td>
                      <Td className="text-slate-500">{b.email}</Td>
                      <Td>
                        <Badge variant={b.isActive ? "success" : "neutral"}>
                          {b.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </Td>
                      <Td>{formatDate(b.createdAt)}</Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" onClick={() => setEditTarget(b)}>
                            Edit
                          </Button>
                          <Button variant="ghost" onClick={() => setDeleteTarget(b)}>
                            Delete
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  ))}
              {!list.isLoading && list.data?.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No bidders yet.
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

      <CreateBidderModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(v) => createMutation.mutate(v)}
        loading={createMutation.isPending}
      />

      <EditBidderModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={(v) => editTarget && updateMutation.mutate({ id: editTarget.id, input: v })}
        loading={updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete bidder?"
        message={`This will permanently remove ${deleteTarget?.email}. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
      />
    </>
  );
}

function CreateBidderModal({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (v: CreateForm) => void;
  loading?: boolean;
}) {
  const { register, handleSubmit, reset, formState } = useForm<CreateForm>();
  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Create bidder"
      footer={
        <>
          <Button variant="ghost" onClick={() => { reset(); onClose(); }}>
            Cancel
          </Button>
          <Button form="create-bidder-form" type="submit" loading={loading}>
            Create
          </Button>
        </>
      }
    >
      <form
        id="create-bidder-form"
        className="space-y-4"
        onSubmit={handleSubmit((v) => {
          onSubmit(v);
          reset();
        })}
      >
        <Input
          label="Full name"
          {...register("name", { required: "Name is required" })}
          error={formState.errors.name?.message}
        />
        <Input
          label="Email"
          type="email"
          {...register("email", { required: "Email is required" })}
          error={formState.errors.email?.message}
        />
        <Input
          label="Initial password"
          type="password"
          {...register("password", {
            required: "Password is required",
            minLength: { value: 8, message: "Min 8 characters" },
          })}
          error={formState.errors.password?.message}
        />
      </form>
    </Modal>
  );
}

function EditBidderModal({
  target,
  onClose,
  onSubmit,
  loading,
}: {
  target: Bidder | null;
  onClose: () => void;
  onSubmit: (v: UpdateForm) => void;
  loading?: boolean;
}) {
  const { register, handleSubmit, reset, formState } = useForm<UpdateForm>({
    values: target ? { name: target.name, isActive: target.isActive, password: "" } : undefined,
  });
  return (
    <Modal
      open={!!target}
      onClose={() => {
        reset();
        onClose();
      }}
      title={`Edit bidder${target ? ` — ${target.email}` : ""}`}
      footer={
        <>
          <Button variant="ghost" onClick={() => { reset(); onClose(); }}>
            Cancel
          </Button>
          <Button form="edit-bidder-form" type="submit" loading={loading}>
            Save
          </Button>
        </>
      }
    >
      <form
        id="edit-bidder-form"
        className="space-y-4"
        onSubmit={handleSubmit((v) => {
          const payload = { ...v };
          if (!payload.password) delete payload.password;
          onSubmit(payload);
        })}
      >
        <Input label="Full name" {...register("name", { required: true })} error={formState.errors.name?.message} />
        <Input label="New password" type="password" placeholder="Leave blank to keep" {...register("password")} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4" {...register("isActive")} />
          Active
        </label>
      </form>
    </Modal>
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
