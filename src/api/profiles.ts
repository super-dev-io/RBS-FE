import { api } from "./client";
import type { AdminProfile, AiProviderName, BidderProfileSummary, PaginatedResponse } from "@/types";

export interface ProfileInput {
  fullName: string;
  email: string;
  phoneNumber?: string;
  linkedinUrl?: string;
  address?: string;
  masterPrompt: string;
  defaultPdfTemplateId?: string | null;
  aiProvider?: AiProviderName | null;
  aiModel?: string | null;
}

export const profilesApi = {
  async listAdmin(params: { page?: number; pageSize?: number; search?: string } = {}) {
    const { data } = await api.get<PaginatedResponse<AdminProfile>>("/admin/profiles", { params });
    return data;
  },
  async getAdmin(id: string) {
    const { data } = await api.get<{ data: AdminProfile }>(`/admin/profiles/${id}`);
    return data.data;
  },
  async create(input: ProfileInput) {
    const { data } = await api.post<{ data: AdminProfile }>("/admin/profiles", input);
    return data.data;
  },
  async update(id: string, input: Partial<ProfileInput>) {
    const { data } = await api.patch<{ data: AdminProfile }>(`/admin/profiles/${id}`, input);
    return data.data;
  },
  async remove(id: string) {
    await api.delete(`/admin/profiles/${id}`);
  },
  async assign(profileId: string, bidderId: string) {
    const { data } = await api.post(`/admin/profiles/${profileId}/assignments`, { bidderId });
    return data.data;
  },
  async unassign(profileId: string, bidderId: string) {
    await api.delete(`/admin/profiles/${profileId}/assignments/${bidderId}`);
  },
  async listAssignments(profileId: string) {
    const { data } = await api.get(`/admin/profiles/${profileId}/assignments`);
    return data.data as Array<{
      id: string;
      profileId: string;
      bidderId: string;
      bidder: { id: string; name: string; email: string; isActive: boolean };
    }>;
  },

  async listMine(params: { page?: number; pageSize?: number; search?: string } = {}) {
    const { data } = await api.get<PaginatedResponse<BidderProfileSummary>>("/bidder/profiles", {
      params,
    });
    return data;
  },
  async getMine(id: string) {
    const { data } = await api.get<{ data: BidderProfileSummary }>(`/bidder/profiles/${id}`);
    return data.data;
  },
};
