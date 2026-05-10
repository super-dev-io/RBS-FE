import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { profilesApi } from "@/api/profiles";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";

export default function BidderProfiles() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const list = useQuery({
    queryKey: ["bidder", "profiles", { page, search }],
    queryFn: () => profilesApi.listMine({ page, pageSize: 12, search: search || undefined }),
  });

  return (
    <>
      <PageHeader
        title="My profiles"
        description="Profiles assigned to you by an admin. Pick one to generate a tailored resume."
      />

      <div className="card p-4">
        <Input
          placeholder="Search profiles…"
          className="max-w-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {list.isLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (list.data?.data.length ?? 0) === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No profiles assigned"
            description="Ask your admin to assign one or more candidate profiles to your account."
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.data?.data.map((p) => (
            <div key={p.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{p.fullName}</h3>
                  <p className="text-sm text-slate-500">{p.email}</p>
                </div>
                {p.defaultPdfTemplate && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    {p.defaultPdfTemplate.name}
                  </span>
                )}
              </div>
              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="text-xs text-slate-400">
                  {p.phoneNumber ?? "—"}
                </span>
                <Link to={`/app/generate?profileId=${p.id}`} className="btn-primary">
                  Generate
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 card">
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
