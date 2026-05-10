import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { workLogsApi } from "@/api/workLogs";
import { biddersApi } from "@/api/bidders";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { formatDate, formatTime, isoDay } from "@/lib/format";
import type { WorkLog } from "@/types";

export default function AdminWorkLogs() {
  const [page, setPage] = useState(1);
  const [bidderId, setBidderId] = useState("");
  const [date, setDate] = useState("");

  const bidders = useQuery({
    queryKey: ["admin", "bidders", "all"],
    queryFn: () => biddersApi.list({ pageSize: 100 }),
  });

  const list = useQuery({
    queryKey: ["admin", "work-logs", { page, bidderId, date }],
    queryFn: () =>
      workLogsApi.listAdmin({
        page,
        pageSize: 100,
        bidderId: bidderId || undefined,
        date: date || undefined,
      }),
    refetchInterval: 5000,
  });

  const grouped = useMemo(() => groupByDate(list.data?.data ?? []), [list.data]);

  return (
    <>
      <PageHeader
        title="Work logs"
        description="Filter by bidder and/or date. Records are grouped per day."
      />

      <div className="card">
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="min-w-[200px] flex-1">
            <Select
              label="Bidder"
              value={bidderId}
              onChange={(e) => {
                setBidderId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All bidders</option>
              {bidders.data?.data.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.email})
                </option>
              ))}
            </Select>
          </div>
          <div className="w-44">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <button
            className="btn-ghost"
            onClick={() => {
              setBidderId("");
              setDate("");
              setPage(1);
            }}
          >
            Clear
          </button>
        </div>

        <div className="px-4 py-2">
          {list.isLoading ? (
            <Skeleton className="h-32" />
          ) : grouped.length === 0 ? (
            <div className="px-2 py-12 text-center text-sm text-slate-500">No records.</div>
          ) : (
            grouped.map((group) => (
              <div key={group.date} className="my-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {formatDate(group.date)}
                  </h3>
                  <span className="text-xs text-slate-400">{group.items.length} records</span>
                </div>
                <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
                  <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900/40">
                      <tr>
                        <Th>Time</Th>
                        <Th>Bidder</Th>
                        <Th>Profile</Th>
                        <Th>Company</Th>
                        <Th>Role</Th>
                        <Th>Status</Th>
                        <Th>Resume</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {group.items.map((row) => (
                        <tr key={row.id}>
                          <Td>{formatTime(row.createdAt)}</Td>
                          <Td>{row.bidder?.name ?? row.bidder?.email}</Td>
                          <Td>{row.profile?.fullName}</Td>
                          <Td>{row.companyName}</Td>
                          <Td>{row.roleTitle}</Td>
                          <Td>
                            <StatusBadge status={row.generationStatus} />
                          </Td>
                          <Td>
                            {row.generatedResumeId ? (
                              <Link
                                to={`/admin/generations/${row.generatedResumeId}`}
                                className="text-brand-600 hover:underline"
                              >
                                View
                              </Link>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
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

function groupByDate(rows: WorkLog[]) {
  const map = new Map<string, WorkLog[]>();
  for (const r of rows) {
    const key = isoDay(r.createdAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, items]) => ({ date, items }));
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left font-semibold">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2.5 align-middle">{children}</td>;
}
