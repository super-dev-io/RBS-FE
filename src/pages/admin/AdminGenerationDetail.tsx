import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { generationsApi } from "@/api/generations";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/Button";

export default function AdminGenerationDetail() {
  const { id = "" } = useParams();
  const gen = useQuery({
    queryKey: ["admin", "generation", id],
    queryFn: () => generationsApi.getAdmin(id),
    enabled: !!id,
    refetchInterval: (q) => {
      const data = q.state.data;
      return data && (data.status === "PENDING" || data.status === "PROCESSING") ? 3000 : false;
    },
  });

  return (
    <>
      <PageHeader
        title="Generation"
        description={gen.data ? `${gen.data.profile?.fullName} → ${gen.data.companyName}` : ""}
        actions={
          <Link to="/admin/generations" className="btn-ghost">
            ← Back
          </Link>
        }
      />

      {gen.isLoading || !gen.data ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card lg:col-span-2 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
              <h2 className="section-title">Generated PDF</h2>
              {gen.data.status === "COMPLETED" && (
                <Button
                  onClick={async () => {
                    const blob = await generationsApi.download(gen.data!.id, "admin");
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `resume-${gen.data!.id}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download
                </Button>
              )}
            </div>
            <div className="bg-slate-100 dark:bg-slate-950">
              {gen.data.status === "COMPLETED" ? (
                <PdfViewer id={gen.data.id} role="admin" />
              ) : gen.data.status === "FAILED" ? (
                <div className="p-6 text-sm">
                  <p className="font-semibold text-red-600">Generation failed</p>
                  <pre className="mt-2 whitespace-pre-wrap rounded bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40">
                    {gen.data.errorMessage ?? "Unknown error"}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-8 text-sm text-slate-500">
                  <Spinner /> Processing — this typically takes 10–60 seconds.
                </div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="section-title mb-4">Details</h2>
            <dl className="space-y-3 text-sm">
              <Row label="Status">
                <StatusBadge status={gen.data.status} />
              </Row>
              <Row label="Bidder">{gen.data.bidder?.name} ({gen.data.bidder?.email})</Row>
              <Row label="Profile">{gen.data.profile?.fullName}</Row>
              <Row label="Template">{gen.data.template?.name}</Row>
              <Row label="Company">{gen.data.companyName}</Row>
              <Row label="Role">{gen.data.roleTitle}</Row>
              <Row label="AI">
                {gen.data.aiProvider ? `${gen.data.aiProvider} · ${gen.data.aiModel}` : "—"}
              </Row>
              <Row label="Created">{formatDateTime(gen.data.createdAt)}</Row>
              <Row label="Completed">{formatDateTime(gen.data.completedAt ?? undefined)}</Row>
            </dl>

            <h3 className="mt-6 mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Job description
            </h3>
            <pre className="whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs leading-relaxed dark:bg-slate-950">
              {gen.data.jobDescription}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}

function PdfViewer({ id, role }: { id: string; role: "admin" | "bidder" }) {
  const url = `${import.meta.env.VITE_API_URL}/${role}/generations/${id}/download`;
  // Use object element so the browser sends auth via fetch-in-blob trick is too heavy;
  // better to use authenticated iframe pattern via blob URL:
  return <AuthedPdfFrame url={url} />;
}

function AuthedPdfFrame({ url }: { url: string }) {
  const { data } = useQuery({
    queryKey: ["pdf-frame", url],
    queryFn: async () => {
      const token = localStorage.getItem("rt_access");
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Failed to load PDF");
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    },
    staleTime: 60_000,
  });
  if (!data) return <div className="p-6 text-sm text-slate-500">Loading PDF…</div>;
  return <iframe title="resume-pdf" src={data} className="h-[80vh] w-full border-0" />;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-brand-600" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}
