import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

  const profiles = useQuery({
    queryKey: ["bidder", "profiles", "all"],
    queryFn: () => profilesApi.listMine({ pageSize: 100 }),
  });

  const { register, handleSubmit, formState, watch, setValue } = useForm<CreateGenerationInput>({
    defaultValues: {
      profileId: params.get("profileId") ?? "",
      companyName: "",
      roleTitle: "",
      jobDescription: "",
    },
  });

  useEffect(() => {
    const fromQuery = params.get("profileId");
    if (fromQuery) setValue("profileId", fromQuery);
  }, [params, setValue]);

  const profileId = watch("profileId");
  const selectedProfile = profiles.data?.data.find((p) => p.id === profileId);

  const create = useMutation({
    mutationFn: generationsApi.create,
    onSuccess: (g) => {
      toast.success("Generation queued");
      navigate(`/app/generations/${g.id}`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed"),
  });

  return (
    <>
      <PageHeader
        title="Generate resume"
        description="Pick a profile, paste the job description, and we'll tailor the resume for you."
      />

      {profiles.isLoading ? (
        <Skeleton className="h-80" />
      ) : (
        <form
          onSubmit={handleSubmit((v) => create.mutate(v))}
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
                setParams(v ? { profileId: v } : {});
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
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Master prompt</div>
                  <pre className="mt-1 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs leading-relaxed dark:bg-slate-950">
                    {selectedProfile.masterPrompt}
                  </pre>
                </div>
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
