import api from "./api";
import type {
  Issue,
  IssueListResponse,
  IssueCreate,
  IssueUpdate,
  TransitionOption,
  AuditLog,
  SLAInfo,
} from "@/types";

export async function fetchIssues(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  category?: string;
  priority?: string;
  is_overdue?: boolean;
}): Promise<IssueListResponse> {
  const res = await api.get<IssueListResponse>("/issues", { params });
  return res.data;
}

export async function fetchIssue(id: string): Promise<Issue> {
  const res = await api.get<Issue>(`/issues/${id}`);
  return res.data;
}

export async function createIssue(data: IssueCreate): Promise<Issue> {
  const res = await api.post<Issue>("/issues", data);
  return res.data;
}

export async function updateIssue(id: string, data: IssueUpdate): Promise<Issue> {
  const res = await api.patch<Issue>(`/issues/${id}`, data);
  return res.data;
}

export async function transitionIssue(id: string, target_state: string): Promise<Issue> {
  const res = await api.post<Issue>(`/issues/${id}/transition`, { target_state });
  return res.data;
}

export async function fetchTransitions(id: string): Promise<TransitionOption[]> {
  const res = await api.get<TransitionOption[]>(`/issues/${id}/transitions`);
  return res.data;
}

export async function fetchIssueAudit(id: string): Promise<{ items: AuditLog[]; total: number }> {
  const res = await api.get(`/issues/${id}/audit`);
  return res.data;
}

export async function fetchIssueSLA(id: string): Promise<SLAInfo> {
  const res = await api.get<SLAInfo>(`/issues/${id}/sla`);
  return res.data;
}
