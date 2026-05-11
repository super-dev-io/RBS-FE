import { api } from "./client";
import type { GenerationStatus } from "@/types";

export interface BidderWorkspaceRow {
  label: string;
  createdAt: string;
  generationCount: number;
}

export interface BidderWorkspaceGeneration {
  id: string;
  companyName: string;
  roleTitle: string;
  status: GenerationStatus;
  errorMessage?: string | null;
  hasCoverLetter: boolean;
  createdAt: string;
  completedAt?: string | null;
  profile?: { id: string; fullName: string } | null;
  template?: { id: string; name: string } | null;
}

export const bidderFoldersApi = {
  async create(label?: string) {
    const { data } = await api.post<{ data: { id: string; label: string } }>(
      "/bidder/folders",
      label ? { label } : {}
    );
    return data.data;
  },
  async list() {
    const { data } = await api.get<{ data: BidderWorkspaceRow[] }>("/bidder/folders");
    return data.data;
  },
  async listGenerations(label: string) {
    const { data } = await api.get<{ data: BidderWorkspaceGeneration[] }>(
      `/bidder/folders/${encodeURIComponent(label)}/generations`
    );
    return data.data;
  },
};
