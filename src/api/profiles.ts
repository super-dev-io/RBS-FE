import { api } from "./client";
import type { PaginatedResponse, Profile } from "@/types";

export interface ProfileInput {
  fullName: string;
  email: string;
  phoneNumber?: string;
  linkedinUrl?: string;
  address?: string;
  masterPrompt: string;
  defaultPdfTemplateId?: string;
}

export const profilesApi = {
  async listAdmin(params: { page?: number; pageSize?: number; search?: string } = {}) {
    const { data } = await api.get<PaginatedResponse<Profile>>("/admin/profiles", { params });
    return data;
  },
  async getAdmin(id: string) {
    const { data } = await api.get<{ data: Profile }>(`/admin/profiles/${id}`);
    return data.data;
  },
  async create(input: ProfileInput) {
    const { data } = await api.post<{ data: Profile }>("/admin/profiles", input);
    return data.data;
  },
  async update(id: string, input: Partial<ProfileInput>) {
    const { data } = await api.patch<{ data: Profile }>(`/admin/profiles/${id}`, input);
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
    const { data } = await api.get<PaginatedResponse<Profile>>("/bidder/profiles", { params });
    return data;
  },
  async getMine(id: string) {
    const { data } = await api.get<{ data: Profile }>(`/bidder/profiles/${id}`);
    return data.data;
  },
};
