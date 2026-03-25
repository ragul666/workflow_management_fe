import api from "./api";
import type { TokenResponse, User } from "@/types";

export async function login(email: string, password: string): Promise<TokenResponse> {
  const res = await api.post<TokenResponse>("/auth/login", { email, password });
  return res.data;
}

export async function register(data: {
  email: string;
  password: string;
  full_name: string;
  tenant_slug: string;
  role?: string;
}): Promise<User> {
  const res = await api.post<User>("/auth/register", data);
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await api.get<User>("/auth/me");
  return res.data;
}

export async function refreshToken(refresh_token: string): Promise<TokenResponse> {
  const res = await api.post<TokenResponse>("/auth/refresh", { refresh_token });
  return res.data;
}
