import { api } from "./client";
import type { PaginatedResponse, WorkLog } from "@/types";

export const workLogsApi = {
  async listAdmin(
    params: {
      page?: number;
      pageSize?: number;
      bidderId?: string;
      date?: string;
      from?: string;
      to?: string;
    } = {}
  ) {
    const { data } = await api.get<PaginatedResponse<WorkLog>>("/admin/work-logs", { params });
    return data;
  },
  async listMine(
    params: { page?: number; pageSize?: number; date?: string; from?: string; to?: string } = {}
  ) {
    const { data } = await api.get<PaginatedResponse<WorkLog>>("/bidder/work-logs", { params });
    return data;
  },
};
