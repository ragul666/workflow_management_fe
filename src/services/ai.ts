import api from "./api";
import type { AISummary } from "@/types";

export async function generateSummary(issue_id: string): Promise<AISummary> {
  const res = await api.post<AISummary>("/ai/generate-summary", { issue_id });
  return res.data;
}

export async function fetchSummaries(issue_id: string): Promise<{ items: AISummary[] }> {
  const res = await api.get(`/ai/summaries/${issue_id}`);
  return res.data;
}
