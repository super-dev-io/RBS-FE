import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { biddersApi } from "@/api/bidders";
import { profilesApi } from "@/api/profiles";
import { templatesApi } from "@/api/templates";
import { generationsApi } from "@/api/generations";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";

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
  const generations = useQuery({
    queryKey: ["admin", "generations", "recent"],
    queryFn: () => generationsApi.listAdmin({ pageSize: 8 }),
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Operational overview of your team's resume generation activity."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Bidders" value={bidders.data?.pagination.total} loading={bidders.isLoading} />
        <Stat label="Profiles" value={profiles.data?.pagination.total} loading={profiles.isLoading} />
        <Stat label="Templates" value={templates.data?.pagination.total} loading={templates.isLoading} />
        <Stat
          label="Generations"
          value={generations.data?.pagination.total}
          loading={generations.isLoading}
        />
      </div>

      <div className="card mt-8">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <h2 className="section-title">Recent generations</h2>
          <Link to="/admin/generations" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900/40">
              <tr>
                <Th>Time</Th>
                <Th>Bidder</Th>
                <Th>Profile</Th>
                <Th>Company</Th>
                <Th>Role</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {generations.isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, c) => (
                        <td key={c} className="px-4 py-3">
                          <Skeleton />
                        </td>
                      ))}
                    </tr>
                  ))
                : generations.data?.data.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <Td>{formatDateTime(g.createdAt)}</Td>
                      <Td>{g.bidder?.name ?? g.bidder?.email}</Td>
                      <Td>{g.profile?.fullName}</Td>
                      <Td>{g.companyName}</Td>
                      <Td>{g.roleTitle}</Td>
                      <Td>
                        <StatusBadge status={g.status} />
                      </Td>
                    </tr>
                  ))}
              {!generations.isLoading && generations.data?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No generations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-semibold">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-middle">{children}</td>;
}
