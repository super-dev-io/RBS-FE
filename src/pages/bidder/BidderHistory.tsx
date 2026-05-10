import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { generationsApi } from "@/api/generations";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { formatDateTime } from "@/lib/format";
import type { GenerationStatus } from "@/types";

export default function BidderHistory() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<GenerationStatus | "">("");

  const list = useQuery({
    queryKey: ["bidder", "generations", { page, status }],
    queryFn: () =>
      generationsApi.listMine({
        page,
        pageSize: 20,
        status: (status || undefined) as GenerationStatus | undefined,
      }),
    refetchInterval: 5000,
  });

  return (
    <>
      <PageHeader title="Generation history" description="All resumes you've generated." />

      <div className="card">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as any);
              setPage(1);
            }}
            className="max-w-xs"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </Select>
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
              {list.isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, c) => (
                        <td key={c} className="px-4 py-3"><Skeleton /></td>
                      ))}
                    </tr>
                  ))
                : list.data?.data.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
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
              {!list.isLoading && list.data?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Nothing yet.
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
    </>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
