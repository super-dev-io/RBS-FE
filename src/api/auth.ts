import { api } from "./client";
import type { AuthTokens, AuthUser } from "@/types";

export const authApi = {
  async login(email: string, password: string) {
    const { data } = await api.post<AuthTokens & { user: AuthUser }>("/auth/login", {
      email,
      password,
    });
    return data;
  },
  async me() {
    const { data } = await api.get<{ user: AuthUser }>("/auth/me");
    return data.user;
  },
  async logout(refreshToken: string) {
    await api.post("/auth/logout", { refreshToken });
  },
};
