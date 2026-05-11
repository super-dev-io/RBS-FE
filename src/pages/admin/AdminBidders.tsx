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
import { EntityCard } from "@/components/ui/EntityCard";
import { Avatar } from "@/components/ui/Icons";
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

      <div className="mb-4 flex items-center gap-3">
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

      {list.isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : list.data?.data.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-slate-500">
          No bidders yet. Click "New bidder" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.data?.data.map((b) => (
            <EntityCard
              key={b.id}
              leading={<Avatar name={b.name} />}
              title={b.name}
              subtitle={b.email}
              badges={[
                { label: b.isActive ? "Active" : "Disabled", tone: b.isActive ? "accent" : "muted" },
                { label: `${b._count?.assignments ?? 0} profiles` },
                { label: `${b._count?.generations ?? 0} resumes` },
                {
                  label: b.lastActiveAt ? `Active ${formatDate(b.lastActiveAt)}` : "No activity",
                  tone: "muted",
                },
              ]}
              actions={[
                { label: "Edit", onClick: () => setEditTarget(b) },
                { label: "Delete", onClick: () => setDeleteTarget(b), destructive: true },
              ]}
            />
          ))}
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

