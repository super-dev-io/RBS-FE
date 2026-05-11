import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { bidderFoldersApi, type BidderWorkspaceGeneration } from "@/api/bidderFolders";
import { generationsApi } from "@/api/generations";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/Badge";
import { FolderIcon, PdfIcon } from "@/components/ui/Icons";
import { formatDate, formatDateTime, formatTime } from "@/lib/format";
import {
  downloadIntoCompanyFolder,
  supportsCompanyFolderDownload,
} from "@/lib/downloadInFolder";

function todayLabel(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function BidderFolders() {
  const [params, setParams] = useSearchParams();
  const label = params.get("workspace") ?? "";

  function navTo(next: { workspace?: string }) {
    const merged: Record<string, string> = {};
    if (next.workspace) merged.workspace = next.workspace;
    setParams(merged);
  }

  return (
    <>
      <PageHeader
        title="Workspaces"
        description="Each workspace is a folder of resume work. Open one to see a table of resumes you generated inside it."
      />
      <Breadcrumbs label={label} onNav={navTo} />

      {!label ? (
        <WorkspacesView onPick={(l) => navTo({ workspace: l })} />
      ) : (
        <WorkspaceContentsView label={label} />
      )}
    </>
  );
}

function Breadcrumbs({
  label,
  onNav,
}: {
  label: string;
  onNav: (n: { workspace?: string }) => void;
}) {
  return (
    <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
      <button className="hover:underline" onClick={() => onNav({})}>
        All workspaces
      </button>
      {label && (
        <>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-200">{label}</span>
        </>
      )}
    </nav>
  );
}

function WorkspacesView({ onPick }: { onPick: (label: string) => void }) {
  const qc = useQueryClient();
  const [newLabel, setNewLabel] = useState("");
  const q = useQuery({
    queryKey: ["bidder", "folders"],
    queryFn: () => bidderFoldersApi.list(),
  });

  const create = useMutation({
    mutationFn: (label?: string) => bidderFoldersApi.create(label),
    onSuccess: (f) => {
      qc.invalidateQueries({ queryKey: ["bidder", "folders"] });
      toast.success(`Workspace "${f.label}" ready`);
      setNewLabel("");
      onPick(f.label);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed"),
  });

  if (q.isLoading) return <Skeleton className="h-64" />;
  const rows = q.data ?? [];

  return (
    <>
      <div className="card mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <Input
              label="New workspace"
              placeholder={`e.g. ${todayLabel()} morning push`}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              maxLength={64}
            />
            <p className="mt-1 text-xs text-slate-500">
              Any short name works — date, project, sprint. Leave blank to use today's date.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => create.mutate(newLabel.trim() || undefined)}
              loading={create.isPending}
            >
              Create workspace
            </Button>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-slate-500">
          No workspaces yet. Create one above to start.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((f) => (
            <button
              key={f.label}
              onClick={() => onPick(f.label)}
              className="card flex items-center gap-3 p-5 text-left transition hover:border-brand-400 hover:shadow-md"
            >
              <FolderIcon />
              <div className="min-w-0">
                <div className="truncate font-semibold">{f.label}</div>
                <div className="text-xs text-slate-500">
                  {f.generationCount} {f.generationCount === 1 ? "resume" : "resumes"} ·{" "}
                  {formatDate(f.createdAt)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function WorkspaceContentsView({ label }: { label: string }) {
  const q = useQuery({
    queryKey: ["bidder", "folders", label, "generations"],
    queryFn: () => bidderFoldersApi.listGenerations(label),
    refetchInterval: 4000,
  });
  const canPickFolder = supportsCompanyFolderDownload();

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          {!canPickFolder && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Your browser doesn't support folder downloads — files will save individually.
            </p>
          )}
        </div>
        <Link to={`/app/generate?workspace=${encodeURIComponent(label)}`} className="btn-primary">
          + Generate resume
        </Link>
      </div>

      {q.isLoading ? (
        <Skeleton className="h-64" />
      ) : (q.data ?? []).length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-slate-500">
          No resumes in this workspace yet.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900/40">
              <tr>
                <Th>Time</Th>
                <Th>Profile</Th>
                <Th>Company</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {(q.data ?? []).map((g) => (
                <Row key={g.id} g={g} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Row({ g }: { g: BidderWorkspaceGeneration }) {
  const filename = g.profile?.fullName ? `${g.profile.fullName}.pdf` : `${g.id}.pdf`;
  return (
    <tr>
      <Td className="text-slate-500">
        <span title={formatDateTime(g.createdAt)}>{formatTime(g.createdAt)}</span>
      </Td>
      <Td>
        <Link
          to={`/app/generations/${g.id}`}
          className="font-medium text-slate-800 hover:underline dark:text-slate-100"
        >
          <span className="inline-flex items-center gap-2">
            <PdfIcon />
            {g.profile?.fullName ?? filename}
          </span>
        </Link>
      </Td>
      <Td>{g.companyName}</Td>
      <Td className="text-slate-500">{g.roleTitle}</Td>
      <Td>
        <StatusBadge status={g.status} />
      </Td>
      <Td>
        <DownloadAction g={g} />
      </Td>
    </tr>
  );
}

function DownloadAction({ g }: { g: BidderWorkspaceGeneration }) {
  const [busy, setBusy] = useState(false);
  if (g.status !== "COMPLETED") return null;

  async function onClick() {
    if (busy) return;
    setBusy(true);
    try {
      const resumeBlob = await generationsApi.download(g.id);
      const coverLetterBlob = g.hasCoverLetter
        ? await generationsApi.downloadCoverLetter(g.id)
        : null;
      const res = await downloadIntoCompanyFolder({
        companyName: g.companyName,
        fullName: g.profile?.fullName ?? g.id,
        resumeBlob,
        coverLetterBlob,
      });
      if (res.mode === "directory" && res.files.length > 0) {
        toast.success(`Saved ${res.files.length} file${res.files.length === 1 ? "" : "s"}`);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Download failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className="text-brand-600 hover:underline disabled:opacity-50"
      onClick={onClick}
      disabled={busy}
    >
      {busy ? "Saving…" : "Download"}
    </button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left font-semibold">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 align-middle ${className ?? ""}`}>{children}</td>;
}
