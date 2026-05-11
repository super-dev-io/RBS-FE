import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { workLogsApi } from "@/api/workLogs";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/Badge";
import { FolderIcon } from "@/components/ui/Icons";
import { formatDate, formatTime } from "@/lib/format";

export default function AdminWorkLogs() {
  const [params, setParams] = useSearchParams();
  const bidderId = params.get("bidder") ?? "";
  const date = params.get("date") ?? "";

  function navTo(next: { bidder?: string; date?: string }) {
    const merged: Record<string, string> = {};
    if (next.bidder) merged.bidder = next.bidder;
    if (next.date) merged.date = next.date;
    setParams(merged);
  }

  return (
    <>
      <PageHeader
        title="Work logs"
        description="Pick a bidder, then drill into a date folder to see that day's activity."
      />

      <Breadcrumbs bidderId={bidderId} date={date} onNav={navTo} />

      {!bidderId ? (
        <BiddersView onPick={(id) => navTo({ bidder: id })} />
      ) : !date ? (
        <FoldersView bidderId={bidderId} onPick={(d) => navTo({ bidder: bidderId, date: d })} />
      ) : (
        <FolderContentsView bidderId={bidderId} date={date} />
      )}
    </>
  );
}

function Breadcrumbs({
  bidderId,
  date,
  onNav,
}: {
  bidderId: string;
  date: string;
  onNav: (n: { bidder?: string; date?: string }) => void;
}) {
  return (
    <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
      <button className="hover:underline" onClick={() => onNav({})}>
        All bidders
      </button>
      {bidderId && (
        <>
          <span>/</span>
          {date ? (
            <button
              className="hover:underline"
              onClick={() => onNav({ bidder: bidderId })}
            >
              Bidder
            </button>
          ) : (
            <span className="text-slate-700 dark:text-slate-200">Bidder</span>
          )}
        </>
      )}
      {date && (
        <>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-200">{date.replaceAll("-", "/")}</span>
        </>
      )}
    </nav>
  );
}

function BiddersView({ onPick }: { onPick: (bidderId: string) => void }) {
  const q = useQuery({
    queryKey: ["admin", "work-logs", "bidders"],
    queryFn: () => workLogsApi.listBiddersAdmin(),
  });
  if (q.isLoading) return <Skeleton className="h-64" />;
  const rows = q.data ?? [];
  if (rows.length === 0) {
    return (
      <div className="card px-6 py-12 text-center text-sm text-slate-500">
        No bidders have logged any work yet.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <button
          key={row.bidder.id}
          onClick={() => onPick(row.bidder.id)}
          className="card p-5 text-left hover:border-brand-400 hover:shadow-md transition"
        >
          <div className="font-semibold">{row.bidder.name}</div>
          <div className="text-xs text-slate-500">{row.bidder.email}</div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {row.logCount} {row.logCount === 1 ? "log" : "logs"}
            </span>
            <span className="text-slate-400">
              Last activity: {row.lastActivityAt ? formatDate(row.lastActivityAt) : "—"}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function FoldersView({
  bidderId,
  onPick,
}: {
  bidderId: string;
  onPick: (date: string) => void;
}) {
  const q = useQuery({
    queryKey: ["admin", "work-logs", "folders", bidderId],
    queryFn: () => workLogsApi.listFoldersAdmin(bidderId),
  });
  if (q.isLoading) return <Skeleton className="h-64" />;
  const folders = q.data ?? [];
  if (folders.length === 0) {
    return (
      <div className="card px-6 py-12 text-center text-sm text-slate-500">
        This bidder has no work logs.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {folders.map((f) => (
        <button
          key={f.date}
          onClick={() => onPick(f.date)}
          className="card flex items-center gap-3 p-5 text-left hover:border-brand-400 hover:shadow-md transition"
        >
          <FolderIcon />
          <div>
            <div className="font-semibold">{f.date.replaceAll("-", "/")}</div>
            <div className="text-xs text-slate-500">
              {f.count} {f.count === 1 ? "log" : "logs"}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function FolderContentsView({ bidderId, date }: { bidderId: string; date: string }) {
  const q = useQuery({
    queryKey: ["admin", "work-logs", "folder", bidderId, date],
    queryFn: () => workLogsApi.listFolderContentsAdmin(bidderId, date),
    refetchInterval: 5000,
  });
  const [openJd, setOpenJd] = useState<string | null>(null);

  if (q.isLoading) return <Skeleton className="h-64" />;
  const rows = q.data ?? [];
  if (rows.length === 0) {
    return (
      <div className="card px-6 py-12 text-center text-sm text-slate-500">
        No logs on this date.
      </div>
    );
  }
  return (
    <>
      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900/40">
            <tr>
              <Th>Time</Th>
              <Th>Company</Th>
              <Th>Role</Th>
              <Th>JD</Th>
              <Th>Status</Th>
              <Th>Duration</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.map((row) => {
              const jd = row.generatedResume?.jobDescription;
              const duration = computeDuration(
                row.createdAt,
                row.completedAt ?? row.generatedResume?.completedAt ?? undefined
              );
              return (
                <tr key={row.id}>
                  <Td>{formatTime(row.createdAt)}</Td>
                  <Td>{row.companyName}</Td>
                  <Td>{row.roleTitle}</Td>
                  <Td>
                    {jd ? (
                      <button
                        className="text-brand-600 hover:underline"
                        onClick={() => setOpenJd(jd)}
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={row.generationStatus} />
                  </Td>
                  <Td>{duration ?? "—"}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {openJd && (
        <JdModal text={openJd} onClose={() => setOpenJd(null)} />
      )}
    </>
  );
}

function JdModal({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Job description
          </h3>
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {text}
        </pre>
      </div>
    </div>
  );
}

function computeDuration(start: string, end?: string | null): string | null {
  if (!end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return rem === 0 ? `${min}m` : `${min}m ${rem}s`;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left font-semibold">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2.5 align-middle">{children}</td>;
}
