import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { profilesApi } from "@/api/profiles";
import { generationsApi } from "@/api/generations";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/Button";

export default function BidderDashboard() {
  const profiles = useQuery({
    queryKey: ["bidder", "profiles", "stats"],
    queryFn: () => profilesApi.listMine({ pageSize: 1 }),
  });
  const recent = useQuery({
    queryKey: ["bidder", "generations", "recent"],
    queryFn: () => generationsApi.listMine({ pageSize: 6 }),
    refetchInterval: 5000,
  });

  return (
    <>
      <PageHeader
        title="Welcome back"
        description="Generate a tailored resume from one of your assigned profiles."
        actions={
          <Link to="/app/generate" className="btn-primary">
            New generation
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          label="Assigned profiles"
          value={profiles.data?.pagination.total}
          loading={profiles.isLoading}
        />
        <Stat
          label="Generations"
          value={recent.data?.pagination.total}
          loading={recent.isLoading}
        />
        <div className="card flex items-center justify-between p-5">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Need to generate?
            </div>
            <div className="mt-1 text-sm text-slate-500">Pick a profile and paste a JD.</div>
          </div>
          <Link to="/app/generate" className="btn-primary">
            Start
          </Link>
        </div>
      </div>

      <div className="card mt-8">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <h2 className="section-title">Recent generations</h2>
          <Link to="/app/folders" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900/40">
              <tr>
                <Th>Time</Th>
                <Th>Profile</Th>
                <Th>Company</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th className="text-right">Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {recent.isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, c) => (
                        <td key={c} className="px-4 py-3"><Skeleton /></td>
                      ))}
                    </tr>
                  ))
                : recent.data?.data.map((g) => (
                    <tr key={g.id}>
                      <Td>{formatDateTime(g.createdAt)}</Td>
                      <Td>{g.profile?.fullName}</Td>
                      <Td>{g.companyName}</Td>
                      <Td>{g.roleTitle}</Td>
                      <Td><StatusBadge status={g.status} /></Td>
                      <Td className="text-right">
                        <Link to={`/app/generations/${g.id}`} className="btn-ghost">
                          View
                        </Link>
                      </Td>
                    </tr>
                  ))}
              {!recent.isLoading && recent.data?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No generations yet — start your first one!
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

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
