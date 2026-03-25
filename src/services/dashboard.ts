import api from "./api";
import type { DashboardMetrics } from "@/types";

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await api.get<DashboardMetrics>("/dashboard/metrics");
  return res.data;
}
