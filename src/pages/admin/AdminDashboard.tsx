import { useQuery } from "@tanstack/react-query";
import { biddersApi } from "@/api/bidders";
import { profilesApi } from "@/api/profiles";
import { templatesApi } from "@/api/templates";
import { analyticsApi } from "@/api/analytics";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { ResumesPerDayChart } from "@/components/charts/ResumesPerDayChart";

export default function AdminDashboard() {
  const bidders = useQuery({
    queryKey: ["admin", "bidders", "stats"],
    queryFn: () => biddersApi.list({ pageSize: 1 }),
  });
  const profiles = useQuery({
    queryKey: ["admin", "profiles", "stats"],
    queryFn: () => profilesApi.listAdmin({ pageSize: 1 }),
  });
  const templates = useQuery({
    queryKey: ["admin", "templates", "stats"],
    queryFn: () => templatesApi.list({ pageSize: 1 }),
  });
  const trend = useQuery({
    queryKey: ["admin", "analytics", "resumes-per-day", 7],
    queryFn: () => analyticsApi.resumesPerDay(7),
    refetchInterval: 30_000,
  });

  const last7Total =
    trend.data?.reduce((acc, d) => acc + d.count, 0) ?? undefined;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resume generation activity at a glance."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Bidders" value={bidders.data?.pagination.total} loading={bidders.isLoading} />
        <Stat label="Profiles" value={profiles.data?.pagination.total} loading={profiles.isLoading} />
        <Stat label="Templates" value={templates.data?.pagination.total} loading={templates.isLoading} />
        <Stat
          label="Resumes (last 7 days)"
          value={last7Total}
          loading={trend.isLoading}
        />
      </div>

      <div className="card mt-8 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Resumes per day (last 7 days)</h2>
        </div>
        {trend.isLoading ? (
          <Skeleton className="h-56" />
        ) : (
          <ResumesPerDayChart data={trend.data ?? []} />
        )}
      </div>
    </>
  );
}

function Stat({ label, value, loading }: { label: string; value?: number; loading?: boolean }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-2">
        {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-3xl font-semibold">{value ?? 0}</div>}
      </div>
    </div>
  );
}
