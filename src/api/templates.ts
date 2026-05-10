import { api, getApiUrl, tokenStore } from "./client";
import type { PaginatedResponse, ResumeTemplate, TemplateConfig } from "@/types";

export interface TemplateInput {
  name: string;
  description?: string;
  config: TemplateConfig;
  thumbnailUrl?: string;
}

export const templatesApi = {
  async list(params: { page?: number; pageSize?: number; search?: string } = {}) {
    const { data } = await api.get<PaginatedResponse<ResumeTemplate>>("/admin/templates", {
      params,
    });
    return data;
  },
  async listAvailable() {
    const { data } = await api.get<{ data: { id: string; name: string; description?: string }[] }>(
      "/admin/templates/available"
    );
    return data.data;
  },
  async get(id: string) {
    const { data } = await api.get<{ data: ResumeTemplate }>(`/admin/templates/${id}`);
    return data.data;
  },
  async create(input: TemplateInput) {
    const { data } = await api.post<{ data: ResumeTemplate }>("/admin/templates", input);
    return data.data;
  },
  async update(id: string, input: Partial<TemplateInput>) {
    const { data } = await api.patch<{ data: ResumeTemplate }>(`/admin/templates/${id}`, input);
    return data.data;
  },
  async remove(id: string) {
    await api.delete(`/admin/templates/${id}`);
  },
  async previewHtml(id: string) {
    const token = tokenStore.getAccess();
    const res = await fetch(`${getApiUrl()}/admin/templates/${id}/preview.html`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error("Failed to load preview");
    return res.text();
  },
};
