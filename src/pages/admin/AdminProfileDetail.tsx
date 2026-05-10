import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { profilesApi, type ProfileInput } from "@/api/profiles";
import { biddersApi } from "@/api/bidders";
import { templatesApi } from "@/api/templates";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";

export default function AdminProfileDetail() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const profile = useQuery({
    queryKey: ["admin", "profile", id],
    queryFn: () => profilesApi.getAdmin(id),
    enabled: !!id,
  });
  const templates = useQuery({
    queryKey: ["admin", "templates", "available"],
    queryFn: () => templatesApi.listAvailable(),
  });
  const bidders = useQuery({
    queryKey: ["admin", "bidders", "all"],
    queryFn: () => biddersApi.list({ pageSize: 100 }),
  });

  const update = useMutation({
    mutationFn: (input: Partial<ProfileInput>) => profilesApi.update(id, input),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin", "profile", id] });
      qc.invalidateQueries({ queryKey: ["admin", "profiles"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed"),
  });

  const assign = useMutation({
    mutationFn: (bidderId: string) => profilesApi.assign(id, bidderId),
    onSuccess: () => {
      toast.success("Assigned");
      qc.invalidateQueries({ queryKey: ["admin", "profile", id] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed"),
  });

  const unassign = useMutation({
    mutationFn: (bidderId: string) => profilesApi.unassign(id, bidderId),
    onSuccess: () => {
      toast.success("Unassigned");
      qc.invalidateQueries({ queryKey: ["admin", "profile", id] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed"),
  });

  return (
    <>
      <PageHeader
        title={profile.data?.fullName ?? "Profile"}
        description={profile.data?.email}
        actions={
          <Link to="/admin/profiles" className="btn-ghost">
            ← Back
          </Link>
        }
      />

      {profile.isLoading || !profile.data ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card lg:col-span-2 p-5">
            <h2 className="section-title mb-4">Edit profile</h2>
            <ProfileForm
              defaults={profile.data}
              templates={templates.data ?? []}
              loading={update.isPending}
              onSubmit={(v) => update.mutate(v)}
            />
          </div>

          <div className="card p-5">
            <h2 className="section-title mb-4">Assignments</h2>
            <AssignSection
              currentBidderIds={(profile.data.assignments ?? []).map((a: any) => a.bidder.id)}
              bidders={bidders.data?.data ?? []}
              loading={bidders.isLoading || assign.isPending}
              onAssign={(bidderId) => assign.mutate(bidderId)}
              onUnassign={(bidderId) => unassign.mutate(bidderId)}
            />
          </div>
        </div>
      )}
    </>
  );
}

function ProfileForm({
  defaults,
  templates,
  loading,
  onSubmit,
}: {
  defaults: any;
  templates: Array<{ id: string; name: string }>;
  loading: boolean;
  onSubmit: (v: Partial<ProfileInput>) => void;
}) {
  const { register, handleSubmit, formState } = useForm<ProfileInput>({
    defaultValues: {
      fullName: defaults.fullName ?? "",
      email: defaults.email ?? "",
      phoneNumber: defaults.phoneNumber ?? "",
      linkedinUrl: defaults.linkedinUrl ?? "",
      address: defaults.address ?? "",
      masterPrompt: defaults.masterPrompt ?? "",
      defaultPdfTemplateId: defaults.defaultPdfTemplateId ?? "",
    },
  });
  return (
    <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <Input label="Full name" {...register("fullName", { required: true })} error={formState.errors.fullName?.message} />
      <Input label="Email" type="email" {...register("email", { required: true })} error={formState.errors.email?.message} />
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
      <Textarea
        label="Master prompt"
        className="sm:col-span-2 min-h-[260px] font-mono text-xs"
        {...register("masterPrompt", { required: true })}
      />
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" loading={loading}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

function AssignSection({
  currentBidderIds,
  bidders,
  loading,
  onAssign,
  onUnassign,
}: {
  currentBidderIds: string[];
  bidders: Array<{ id: string; name: string; email: string; isActive: boolean }>;
  loading: boolean;
  onAssign: (bidderId: string) => void;
  onUnassign: (bidderId: string) => void;
}) {
  const [selected, setSelected] = useState<string>("");
  const assigned = bidders.filter((b) => currentBidderIds.includes(b.id));
  const unassigned = bidders.filter((b) => !currentBidderIds.includes(b.id));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={selected} onChange={(e) => setSelected(e.target.value)} className="flex-1">
          <option value="">— Select bidder to assign —</option>
          {unassigned.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.email})
            </option>
          ))}
        </Select>
        <Button
          disabled={!selected || loading}
          onClick={() => {
            if (!selected) return;
            onAssign(selected);
            setSelected("");
          }}
        >
          Assign
        </Button>
      </div>

      <div className="space-y-2">
        {assigned.length === 0 && (
          <p className="text-sm text-slate-500">No assignments yet.</p>
        )}
        {assigned.map((b) => (
          <div
            key={b.id}
            className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
          >
            <div>
              <div className="font-medium">{b.name}</div>
              <div className="text-xs text-slate-500">{b.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={b.isActive ? "success" : "neutral"}>
                {b.isActive ? "Active" : "Disabled"}
              </Badge>
              <Button variant="ghost" onClick={() => onUnassign(b.id)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
