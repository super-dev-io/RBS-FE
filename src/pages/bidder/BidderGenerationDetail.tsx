import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { generationsApi } from "@/api/generations";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/Button";

export default function BidderGenerationDetail() {
  const { id = "" } = useParams();
  const gen = useQuery({
    queryKey: ["bidder", "generation", id],
    queryFn: () => generationsApi.getMine(id),
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
          <Link to="/app/history" className="btn-ghost">
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
              <h2 className="section-title">Resume</h2>
              {gen.data.status === "COMPLETED" && (
                <Button
                  onClick={async () => {
                    const blob = await generationsApi.download(gen.data!.id, "bidder");
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `resume-${gen.data!.companyName}-${gen.data!.roleTitle}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download PDF
                </Button>
              )}
            </div>
            <div className="bg-slate-100 dark:bg-slate-950">
              {gen.data.status === "COMPLETED" ? (
                <AuthedPdfFrame
                  url={`${import.meta.env.VITE_API_URL}/bidder/generations/${gen.data.id}/download`}
                />
              ) : gen.data.status === "FAILED" ? (
                <div className="p-6 text-sm">
                  <p className="font-semibold text-red-600">Generation failed</p>
                  <pre className="mt-2 whitespace-pre-wrap rounded bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40">
                    {gen.data.errorMessage ?? "Unknown error"}
                  </pre>
                  <p className="mt-3 text-slate-500">
                    Try again from the generate page. If this keeps happening, contact your admin.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-8 text-sm text-slate-500">
                  <Spinner /> Cooking up your resume — this typically takes 10–60 seconds.
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
              <Row label="Profile">{gen.data.profile?.fullName}</Row>
              <Row label="Template">{gen.data.template?.name}</Row>
              <Row label="Company">{gen.data.companyName}</Row>
              <Row label="Role">{gen.data.roleTitle}</Row>
              <Row label="Created">{formatDateTime(gen.data.createdAt)}</Row>
              <Row label="Completed">{formatDateTime(gen.data.completedAt ?? undefined)}</Row>
            </dl>
          </div>
        </div>
      )}
    </>
  );
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
