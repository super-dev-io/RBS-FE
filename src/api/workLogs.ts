import { api } from "./client";
import type {
  AdminWorkLogBidder,
  AdminWorkLogFolder,
  PaginatedResponse,
  WorkLog,
} from "@/types";

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
  async listBiddersAdmin() {
    const { data } = await api.get<{ data: AdminWorkLogBidder[] }>(
      "/admin/work-logs/bidders"
    );
    return data.data;
  },
  async listFoldersAdmin(bidderId: string) {
    const { data } = await api.get<{ data: AdminWorkLogFolder[] }>(
      `/admin/work-logs/bidders/${bidderId}/folders`
    );
    return data.data;
  },
  async listFolderContentsAdmin(bidderId: string, date: string) {
    const { data } = await api.get<{ data: WorkLog[] }>(
      `/admin/work-logs/bidders/${bidderId}/folders/${date}`
    );
    return data.data;
  },
  async listMine(
    params: { page?: number; pageSize?: number; date?: string; from?: string; to?: string } = {}
  ) {
    const { data } = await api.get<PaginatedResponse<WorkLog>>("/bidder/work-logs", { params });
    return data;
  },
};
