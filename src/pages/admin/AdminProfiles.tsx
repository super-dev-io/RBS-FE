import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { profilesApi, type ProfileInput } from "@/api/profiles";
import { templatesApi } from "@/api/templates";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import { AI_MODELS, type AdminProfile, type AiProviderName } from "@/types";

export default function AdminProfiles() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminProfile | null>(null);

  const list = useQuery({
    queryKey: ["admin", "profiles", { page, search }],
    queryFn: () => profilesApi.listAdmin({ page, pageSize: 20, search: search || undefined }),
  });

  const templates = useQuery({
    queryKey: ["admin", "templates", "available"],
    queryFn: () => templatesApi.listAvailable(),
  });

  const createMutation = useMutation({
    mutationFn: profilesApi.create,
    onSuccess: () => {
      toast.success("Profile created");
      qc.invalidateQueries({ queryKey: ["admin", "profiles"] });
      setCreateOpen(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: profilesApi.remove,
    onSuccess: () => {
      toast.success("Profile deleted");
      qc.invalidateQueries({ queryKey: ["admin", "profiles"] });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed"),
  });

  return (
    <>
      <PageHeader
        title="Profiles"
        description="Candidate profiles. Each profile is a knowledge base assigned to one or more bidders."
        actions={<Button onClick={() => setCreateOpen(true)}>New profile</Button>}
      />

      <div className="card">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
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
                <Th>Default template</Th>
                <Th>Assignments</Th>
                <Th>Generations</Th>
                <Th>Created</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {list.isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, c) => (
                        <td key={c} className="px-4 py-3"><Skeleton /></td>
                      ))}
                    </tr>
                  ))
                : list.data?.data.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="px-4 py-3 font-medium">
                        <Link to={`/admin/profiles/${p.id}`} className="hover:underline">
                          {p.fullName}
                        </Link>
                      </td>
                      <Td className="text-slate-500">{p.email}</Td>
                      <Td>
                        {p.defaultPdfTemplate?.name ? (
                          <Badge>{p.defaultPdfTemplate.name}</Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </Td>
                      <Td>{p._count?.assignments ?? 0}</Td>
                      <Td>{p._count?.generations ?? 0}</Td>
                      <Td>{formatDate(p.createdAt)}</Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/admin/profiles/${p.id}`} className="btn-ghost">Manage</Link>
                          <Button variant="ghost" onClick={() => setDeleteTarget(p)}>Delete</Button>
                        </div>
                      </Td>
                    </tr>
                  ))}
              {!list.isLoading && list.data?.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No profiles yet. Create one to start onboarding bidders.
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

      <CreateProfileModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(v) => createMutation.mutate(v)}
        loading={createMutation.isPending}
        templates={templates.data ?? []}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete profile?"
        message={`This permanently deletes the profile "${deleteTarget?.fullName}" along with assignments and generations. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
      />
    </>
  );
}

function CreateProfileModal({
  open,
  onClose,
  onSubmit,
  loading,
  templates,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (v: ProfileInput) => void;
  loading?: boolean;
  templates: Array<{ id: string; name: string }>;
}) {
  const { register, handleSubmit, reset, formState, watch, setValue } = useForm<ProfileInput>();
  const templateId = watch("defaultPdfTemplateId");
  const provider = watch("aiProvider");
  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Create profile"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button form="create-profile-form" type="submit" loading={loading}>Create</Button>
        </>
      }
    >
      <form
        id="create-profile-form"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        onSubmit={handleSubmit((v) => {
          onSubmit({
            ...v,
            defaultPdfTemplateId: v.defaultPdfTemplateId || null,
            aiProvider: v.aiProvider || null,
            aiModel: v.aiProvider ? v.aiModel || null : null,
          });
          reset();
        })}
      >
        <Input label="Full name" {...register("fullName", { required: "Required" })} error={formState.errors.fullName?.message} />
        <Input label="Email" type="email" {...register("email", { required: "Required" })} error={formState.errors.email?.message} />
        <Input label="Phone number" {...register("phoneNumber")} />
        <Input label="LinkedIn URL" {...register("linkedinUrl")} />
        <Input label="Address" className="sm:col-span-2" {...register("address")} />
        <Select label="Default PDF template" className="sm:col-span-2" {...register("defaultPdfTemplateId")}>
          <option value="">— None —</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        {templateId && (
          <div className="sm:col-span-2">
            <CreateTemplatePreview templateId={templateId} />
          </div>
        )}
        <Select
          label="AI provider"
          {...register("aiProvider", { onChange: () => setValue("aiModel", null) })}
        >
          <option value="">— Use default —</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </Select>
        <Select label="AI model" {...register("aiModel")} disabled={!provider}>
          <option value="">— Use default —</option>
          {provider &&
            AI_MODELS[provider as AiProviderName].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
        </Select>
        <Textarea
          label="Master prompt (knowledge base)"
          className="sm:col-span-2 min-h-[220px]"
          placeholder={`Experience:\n- 5 yrs Senior Backend Engineer at Acme...\n\nTechnical skills: TypeScript, Node, Postgres...\n\nProjects:\n- ...\n\nEducation: ...\n\nCertifications: ...\n\nWriting style: concise, action-led.\nTarget role direction: senior platform engineering.\nConstraints: no government clients, no relocation.`}
          {...register("masterPrompt", { required: "Required", minLength: { value: 20, message: "Add more detail" } })}
          error={formState.errors.masterPrompt?.message}
        />
      </form>
    </Modal>
  );
}

function CreateTemplatePreview({ templateId }: { templateId: string }) {
  const preview = useQuery({
    queryKey: ["admin", "template-preview", templateId],
    queryFn: () => templatesApi.previewHtml(templateId),
    enabled: !!templateId,
    staleTime: 60_000,
  });
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-800">
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        Template preview
      </div>
      <div className="bg-white">
        {preview.isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading preview…</div>
        ) : preview.data ? (
          <iframe
            title="template-preview"
            className="h-[360px] w-full border-0"
            srcDoc={preview.data}
            sandbox=""
          />
        ) : (
          <div className="p-6 text-sm text-slate-500">Failed to load preview.</div>
        )}
      </div>
    </div>
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
