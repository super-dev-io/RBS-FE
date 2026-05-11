import { api } from "./client";

export interface DayCount {
  date: string;
  count: number;
}

export const analyticsApi = {
  async resumesPerDay(days = 7) {
    const { data } = await api.get<{ data: DayCount[] }>(
      "/admin/analytics/resumes-per-day",
      { params: { days } }
    );
    return data.data;
  },
};
