import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { profilesApi } from "@/api/profiles";
import { generationsApi, type CreateGenerationInput } from "@/api/generations";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";

export default function BidderGenerate() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const label = params.get("workspace") ?? "";

  const profiles = useQuery({
    queryKey: ["bidder", "profiles", "all"],
    queryFn: () => profilesApi.listMine({ pageSize: 100 }),
  });

  const { register, handleSubmit, formState, watch, setValue } = useForm<CreateGenerationInput>({
    defaultValues: {
      profileId: params.get("profileId") ?? "",
      label,
      companyName: "",
      roleTitle: "",
      jobDescription: "",
      generateCoverLetter: true,
    },
  });

  useEffect(() => {
    const fromQuery = params.get("profileId");
    if (fromQuery) setValue("profileId", fromQuery);
    setValue("label", label);
  }, [params, setValue, label]);

  const profileId = watch("profileId");
  const generateCoverLetter = watch("generateCoverLetter");
  const selectedProfile = profiles.data?.data.find((p) => p.id === profileId);

  const create = useMutation({
    mutationFn: generationsApi.create,
    onSuccess: (g) => {
      toast.success("Generation queued");
      navigate(`/app/generations/${g.id}`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed"),
  });

  if (!label) {
    return (
      <>
        <PageHeader
          title="Generate resume"
          description="Open or create a workspace first, then come back here to generate."
        />
        <div className="card p-8 text-center">
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            You need a workspace before generating. Head to your workspaces and create one.
          </p>
          <Link to="/app/folders" className="btn-primary">
            Open workspaces
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Generate resume"
        description={`Adding to workspace "${label}". Pick a profile, paste the JD, generate.`}
        actions={
          <Link to={`/app/folders?workspace=${encodeURIComponent(label)}`} className="btn-ghost">
            ← Back to workspace
          </Link>
        }
      />

      {profiles.isLoading ? (
        <Skeleton className="h-80" />
      ) : (
        <form
          onSubmit={handleSubmit((v) => create.mutate({ ...v, label }))}
          className="grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          <div className="card p-5 space-y-4 lg:col-span-2">
            <Select
              label="Profile"
              {...register("profileId", { required: "Pick a profile" })}
              error={formState.errors.profileId?.message}
              onChange={(e) => {
                const v = e.target.value;
                setValue("profileId", v);
                const next: Record<string, string> = { workspace: label };
                if (v) next.profileId = v;
                setParams(next);
              }}
            >
              <option value="">— Select a profile —</option>
              {profiles.data?.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} — {p.email}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Company"
                placeholder="Acme Corp"
                {...register("companyName", { required: "Required" })}
                error={formState.errors.companyName?.message}
              />
              <Input
                label="Role title"
                placeholder="Senior Software Engineer"
                {...register("roleTitle", { required: "Required" })}
                error={formState.errors.roleTitle?.message}
              />
            </div>
            <Textarea
              label="Job description"
              className="min-h-[260px]"
              placeholder="Paste the full job description here…"
              {...register("jobDescription", { required: "Required", minLength: { value: 20, message: "Add more detail" } })}
              error={formState.errors.jobDescription?.message}
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={generateCoverLetter ?? true}
                onChange={(e) => setValue("generateCoverLetter", e.target.checked)}
              />
              Also generate a tailored cover letter
            </label>

            <div className="flex items-center justify-end">
              <Button type="submit" loading={create.isPending}>
                Generate resume
              </Button>
            </div>
          </div>

          <aside className="card p-5">
            <h3 className="section-title mb-3">Selected profile</h3>
            {selectedProfile ? (
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-semibold">{selectedProfile.fullName}</div>
                  <div className="text-slate-500">{selectedProfile.email}</div>
                </div>
                {selectedProfile.defaultPdfTemplate && (
                  <div className="text-xs">
                    Default template:&nbsp;
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                      {selectedProfile.defaultPdfTemplate.name}
                    </span>
                  </div>
                )}
                {selectedProfile.phoneNumber && (
                  <div className="text-xs text-slate-500">{selectedProfile.phoneNumber}</div>
                )}
                {selectedProfile.linkedinUrl && (
                  <div className="text-xs text-slate-500">{selectedProfile.linkedinUrl}</div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Select a profile to see its details. Only profiles assigned to you appear here.
              </p>
            )}
          </aside>
        </form>
      )}
    </>
  );
}
