import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { templatesApi, type TemplateInput } from "@/api/templates";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ALL_BLOCK_KINDS,
  DEFAULT_TEMPLATE_CONFIG,
  type BlockConfig,
  type BlockKind,
  type Density,
  type FontFamily,
  type Layout,
  type TemplateConfig,
  type ThemeConfig,
} from "@/types";

type FormShape = { name: string; description: string };

const BLOCK_LABELS: Record<BlockKind, string> = {
  header: "Header (name + contact)",
  summary: "Summary",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications",
};

const FONT_OPTIONS: FontFamily[] = ["Inter", "Lora", "Source Sans", "Playfair"];
const DENSITY_OPTIONS: Density[] = ["compact", "normal", "relaxed"];
const LAYOUT_OPTIONS: Layout[] = ["one-col", "two-col"];

function fillBlocks(blocks: BlockConfig[]): BlockConfig[] {
  const byKind = new Map(blocks.map((b) => [b.kind, b]));
  return ALL_BLOCK_KINDS.map((kind, i) => {
    const existing = byKind.get(kind);
    return existing ?? { kind, enabled: true, order: i };
  }).sort((a, b) => a.order - b.order);
}

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

  const [config, setConfig] = useState<TemplateConfig>(DEFAULT_TEMPLATE_CONFIG);

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

  const { register, handleSubmit, reset, formState } = useForm<FormShape>({
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (tpl.data) {
      reset({ name: tpl.data.name, description: tpl.data.description ?? "" });
      setConfig({
        blocks: fillBlocks(tpl.data.config?.blocks ?? DEFAULT_TEMPLATE_CONFIG.blocks),
        theme: { ...DEFAULT_TEMPLATE_CONFIG.theme, ...(tpl.data.config?.theme ?? {}) },
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

  function onSubmit(form: FormShape) {
    const payload: TemplateInput = {
      name: form.name,
      description: form.description || undefined,
      config: { blocks: config.blocks.map((b, i) => ({ ...b, order: i })), theme: config.theme },
    };
    if (isNew) create.mutate(payload);
    else update.mutate(payload);
  }

  return (
    <>
      <PageHeader
        title={isNew ? "New template" : `Edit · ${tpl.data?.name ?? ""}`}
        description="Toggle and reorder sections, then tune the theme. The preview shows real sample data."
        actions={
          <Button variant="ghost" onClick={() => navigate("/admin/templates")}>
            ← Back
          </Button>
        }
      />

      <form
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <Input
              label="Name"
              {...register("name", { required: "Required" })}
              error={formState.errors.name?.message}
            />
            <Input label="Description" {...register("description")} />
          </div>

          <div className="card p-5">
            <h3 className="section-title mb-3">Sections</h3>
            <p className="mb-3 text-xs text-slate-500">
              Drag to reorder. Toggle to include/exclude.
            </p>
            <BlocksEditor
              blocks={config.blocks}
              onChange={(blocks) => setConfig((c) => ({ ...c, blocks }))}
            />
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="section-title mb-2">Theme</h3>
            <ThemeEditor
              theme={config.theme}
              onChange={(theme) => setConfig((c) => ({ ...c, theme }))}
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

function BlocksEditor({
  blocks,
  onChange,
}: {
  blocks: BlockConfig[];
  onChange: (b: BlockConfig[]) => void;
}) {
  const dragKindRef = useRef<BlockKind | null>(null);
  const [overKind, setOverKind] = useState<BlockKind | null>(null);

  function move(from: BlockKind, to: BlockKind) {
    if (from === to) return;
    const fromIdx = blocks.findIndex((b) => b.kind === from);
    const toIdx = blocks.findIndex((b) => b.kind === to);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = blocks.slice();
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onChange(next);
  }

  function moveBy(kind: BlockKind, delta: -1 | 1) {
    const i = blocks.findIndex((b) => b.kind === kind);
    if (i < 0) return;
    const j = i + delta;
    if (j < 0 || j >= blocks.length) return;
    const next = blocks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  function toggle(kind: BlockKind) {
    onChange(blocks.map((b) => (b.kind === kind ? { ...b, enabled: !b.enabled } : b)));
  }

  return (
    <ul className="space-y-2">
      {blocks.map((b, idx) => (
        <li
          key={b.kind}
          draggable
          onDragStart={(e) => {
            dragKindRef.current = b.kind;
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (overKind !== b.kind) setOverKind(b.kind);
          }}
          onDragLeave={() => {
            if (overKind === b.kind) setOverKind(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            const from = dragKindRef.current;
            dragKindRef.current = null;
            setOverKind(null);
            if (from) move(from, b.kind);
          }}
          onDragEnd={() => {
            dragKindRef.current = null;
            setOverKind(null);
          }}
          className={`flex items-center gap-3 rounded-md border bg-white px-3 py-2 dark:bg-slate-950 ${
            overKind === b.kind
              ? "border-brand-500 ring-2 ring-brand-200 dark:ring-brand-900"
              : "border-slate-200 dark:border-slate-800"
          }`}
        >
          <span
            className="cursor-grab select-none text-slate-400 active:cursor-grabbing"
            aria-hidden
          >
            ⋮⋮
          </span>
          <label className="flex flex-1 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={b.enabled}
              onChange={() => toggle(b.kind)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className={b.enabled ? "" : "text-slate-400 line-through"}>
              {BLOCK_LABELS[b.kind]}
            </span>
          </label>
          <div className="flex gap-1">
            <button
              type="button"
              className="btn-ghost px-2 py-1 text-xs"
              onClick={() => moveBy(b.kind, -1)}
              disabled={idx === 0}
              aria-label={`Move ${BLOCK_LABELS[b.kind]} up`}
            >
              ↑
            </button>
            <button
              type="button"
              className="btn-ghost px-2 py-1 text-xs"
              onClick={() => moveBy(b.kind, 1)}
              disabled={idx === blocks.length - 1}
              aria-label={`Move ${BLOCK_LABELS[b.kind]} down`}
            >
              ↓
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ThemeEditor({
  theme,
  onChange,
}: {
  theme: ThemeConfig;
  onChange: (t: ThemeConfig) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="text-sm">
        <span className="mb-1 block font-medium">Font</span>
        <select
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950"
          value={theme.fontFamily}
          onChange={(e) => onChange({ ...theme, fontFamily: e.target.value as FontFamily })}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        <span className="mb-1 block font-medium">Layout</span>
        <select
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950"
          value={theme.layout}
          onChange={(e) => onChange({ ...theme, layout: e.target.value as Layout })}
        >
          {LAYOUT_OPTIONS.map((l) => (
            <option key={l} value={l}>
              {l === "one-col" ? "One column" : "Two columns"}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        <span className="mb-1 block font-medium">Density</span>
        <select
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950"
          value={theme.density}
          onChange={(e) => onChange({ ...theme, density: e.target.value as Density })}
        >
          {DENSITY_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        <span className="mb-1 block font-medium">
          Base font size: {theme.baseFontSize}pt
        </span>
        <input
          type="range"
          min={9}
          max={13}
          step={1}
          value={theme.baseFontSize}
          onChange={(e) => onChange({ ...theme, baseFontSize: Number(e.target.value) })}
          className="w-full"
        />
      </label>

      <label className="text-sm sm:col-span-2">
        <span className="mb-1 block font-medium">Accent color</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={theme.accentColor}
            onChange={(e) => onChange({ ...theme, accentColor: e.target.value })}
            className="h-9 w-12 cursor-pointer rounded border border-slate-300 dark:border-slate-700"
          />
          <code className="text-xs text-slate-500">{theme.accentColor}</code>
        </div>
      </label>
    </div>
  );
}
