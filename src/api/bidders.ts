import { api } from "./client";
import type { Bidder, PaginatedResponse } from "@/types";

export const biddersApi = {
  async list(params: { page?: number; pageSize?: number; search?: string } = {}) {
    const { data } = await api.get<PaginatedResponse<Bidder>>("/admin/bidders", { params });
    return data;
  },
  async get(id: string) {
    const { data } = await api.get<{ data: Bidder }>(`/admin/bidders/${id}`);
    return data.data;
  },
  async create(input: { email: string; password: string; name: string }) {
    const { data } = await api.post<{ data: Bidder }>("/admin/bidders", input);
    return data.data;
  },
  async update(id: string, input: { name?: string; isActive?: boolean; password?: string }) {
    const { data } = await api.patch<{ data: Bidder }>(`/admin/bidders/${id}`, input);
    return data.data;
  },
  async remove(id: string) {
    await api.delete(`/admin/bidders/${id}`);
  },
};
