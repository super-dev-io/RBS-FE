import { api, getApiUrl, tokenStore } from "./client";
import type { GenerationStatus, PaginatedResponse, ResumeGeneration } from "@/types";

export interface CreateGenerationInput {
  profileId: string;
  templateId?: string;
  companyName: string;
  roleTitle: string;
  jobDescription: string;
}

export const generationsApi = {
  async create(input: CreateGenerationInput) {
    const { data } = await api.post<{ data: ResumeGeneration }>("/bidder/generations", input);
    return data.data;
  },
  async listMine(
    params: {
      page?: number;
      pageSize?: number;
      status?: GenerationStatus;
      profileId?: string;
    } = {}
  ) {
    const { data } = await api.get<PaginatedResponse<ResumeGeneration>>("/bidder/generations", {
      params,
    });
    return data;
  },
  async getMine(id: string) {
    const { data } = await api.get<{ data: ResumeGeneration }>(`/bidder/generations/${id}`);
    return data.data;
  },
  async listAdmin(
    params: {
      page?: number;
      pageSize?: number;
      status?: GenerationStatus;
      profileId?: string;
    } = {}
  ) {
    const { data } = await api.get<PaginatedResponse<ResumeGeneration>>("/admin/generations", {
      params,
    });
    return data;
  },
  async getAdmin(id: string) {
    const { data } = await api.get<{ data: ResumeGeneration }>(`/admin/generations/${id}`);
    return data.data;
  },
  async downloadUrl(id: string, role: "bidder" | "admin") {
    return `${getApiUrl()}/${role}/generations/${id}/download`;
  },
  async download(id: string, role: "bidder" | "admin") {
    const token = tokenStore.getAccess();
    const res = await fetch(`${getApiUrl()}/${role}/generations/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error("Failed to download PDF");
    return res.blob();
  },
};
