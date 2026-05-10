import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { templatesApi, type TemplateInput } from "@/api/templates";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminTemplateEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const tpl = useQuery({
    queryKey: ["admin", "template", id],
    queryFn: () => templatesApi.get(id!),
    enabled: !!id,
  });

  const create = useMutation({
    mutationFn: templatesApi.create,
    onSuccess: (t) => {
      toast.success("Template created");
      qc.invalidateQueries({ queryKey: ["admin", "templates"] });
      navigate(`/admin/templates/${t.id}`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed"),
  });

  const update = useMutation({
    mutationFn: (input: TemplateInput) => templatesApi.update(id!, input),
    onSuccess: () => {
      toast.success("Template saved");
      qc.invalidateQueries({ queryKey: ["admin", "templates"] });
      qc.invalidateQueries({ queryKey: ["admin", "template", id] });
      setPreviewKey((k) => k + 1);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed"),
  });

  const { register, handleSubmit, reset, formState } = useForm<TemplateInput>({
    defaultValues: {
      name: "",
      description: "",
      htmlTemplate: STARTER_HTML,
      cssStyles: STARTER_CSS,
    },
  });

  useEffect(() => {
    if (tpl.data) {
      reset({
        name: tpl.data.name,
        description: tpl.data.description ?? "",
        htmlTemplate: tpl.data.htmlTemplate,
        cssStyles: tpl.data.cssStyles,
      });
    }
  }, [tpl.data, reset]);

  const [previewKey, setPreviewKey] = useState(0);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancel = false;
    templatesApi
      .previewHtml(id)
      .then((html) => !cancel && setPreviewHtml(html))
      .catch(() => !cancel && setPreviewHtml("<p>Failed to preview</p>"));
    return () => {
      cancel = true;
    };
  }, [id, previewKey]);

  if (id && tpl.isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <>
      <PageHeader
        title={isNew ? "New template" : `Edit · ${tpl.data?.name ?? ""}`}
        description="Use Mustache-style placeholders. Sections like {{#experience}}…{{/experience}} iterate."
        actions={
          <Button variant="ghost" onClick={() => navigate("/admin/templates")}>
            ← Back
          </Button>
        }
      />

      <form
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        onSubmit={handleSubmit((v) => (isNew ? create.mutate(v) : update.mutate(v)))}
      >
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <Input label="Name" {...register("name", { required: "Required" })} error={formState.errors.name?.message} />
            <Input label="Description" {...register("description")} />
          </div>
          <div className="card p-5">
            <Textarea
              label="HTML template"
              className="min-h-[260px] font-mono text-xs"
              {...register("htmlTemplate", { required: "Required", minLength: 20 })}
              error={formState.errors.htmlTemplate?.message}
            />
          </div>
          <div className="card p-5">
            <Textarea
              label="CSS styles"
              className="min-h-[200px] font-mono text-xs"
              {...register("cssStyles")}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" loading={create.isPending || update.isPending}>
              {isNew ? "Create" : "Save"}
            </Button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <h3 className="text-sm font-semibold">Live preview (sample data)</h3>
            {!isNew && (
              <a
                href={`${import.meta.env.VITE_API_URL}/admin/templates/${id}/preview.pdf`}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
              >
                Open as PDF →
              </a>
            )}
          </div>
          <div className="bg-white">
            {isNew ? (
              <div className="p-6 text-sm text-slate-500">
                Save the template first to preview it.
              </div>
            ) : previewHtml ? (
              <iframe
                title="preview"
                className="h-[80vh] w-full border-0"
                srcDoc={previewHtml}
                sandbox=""
              />
            ) : (
              <div className="p-6 text-sm text-slate-500">Loading preview…</div>
            )}
          </div>
        </div>
      </form>
    </>
  );
}

const STARTER_HTML = `<!DOCTYPE html>
<html><body>
  <header>
    <h1>{{fullName}}</h1>
    <h2>{{targetRole}}</h2>
    <div class="contact">{{email}} · {{phoneNumber}} · {{linkedinUrl}}</div>
  </header>
  <section>
    <h3>Summary</h3>
    <p>{{summary}}</p>
  </section>
  <section>
    <h3>Experience</h3>
    {{#experience}}
      <div class="item">
        <strong>{{title}}</strong> — {{company}} ({{startDate}} – {{endDate}})
        <ul>{{#bullets}}<li>{{.}}</li>{{/bullets}}</ul>
      </div>
    {{/experience}}
  </section>
</body></html>`;

const STARTER_CSS = `body { font-family: Inter, sans-serif; padding: 40px; color: #111; font-size: 11pt; }
h1 { margin: 0; font-size: 22pt; } h2 { margin: 4px 0 16px; color: #555; font-weight: 500; }
h3 { font-size: 11pt; text-transform: uppercase; letter-spacing: .08em; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin: 18px 0 8px; }
.item { margin-bottom: 12px; } ul { margin: 4px 0 4px 20px; }`;
