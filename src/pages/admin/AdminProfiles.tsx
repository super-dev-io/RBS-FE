import { useState } from "react";
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
import { EntityCard } from "@/components/ui/EntityCard";
import { ProfileIcon } from "@/components/ui/Icons";
import { useNavigate } from "react-router-dom";
import { AI_MODELS, type AdminProfile, type AiProviderName } from "@/types";

export default function AdminProfiles() {
  const qc = useQueryClient();
  const navigate = useNavigate();
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
          No profiles yet. Create one to start onboarding bidders.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.data?.data.map((p) => {
            const badges = [];
            if (p.defaultPdfTemplate?.name)
              badges.push({ label: p.defaultPdfTemplate.name, tone: "accent" as const });
            badges.push({ label: `${p._count?.assignments ?? 0} assigned` });
            badges.push({ label: `${p._count?.generations ?? 0} resumes` });
            return (
              <EntityCard
                key={p.id}
                leading={<ProfileIcon />}
                title={p.fullName}
                subtitle={p.email}
                badges={badges}
                onClick={() => navigate(`/admin/profiles/${p.id}`)}
                actions={[
                  { label: "Manage", onClick: () => navigate(`/admin/profiles/${p.id}`) },
                  { label: "Delete", onClick: () => setDeleteTarget(p), destructive: true },
                ]}
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

