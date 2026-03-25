import api from "./api";
import type { WorkflowState, WorkflowTransition } from "@/types";

export async function fetchWorkflowStates(): Promise<WorkflowState[]> {
  const res = await api.get<WorkflowState[]>("/workflow/states");
  return res.data;
}

export async function createWorkflowState(data: {
  name: string;
  slug: string;
  display_order: number;
  is_initial: boolean;
  is_terminal: boolean;
}): Promise<WorkflowState> {
  const res = await api.post<WorkflowState>("/workflow/states", data);
  return res.data;
}

export async function updateWorkflowState(
  id: string,
  data: { name: string; slug: string; display_order: number; is_initial: boolean; is_terminal: boolean }
): Promise<WorkflowState> {
  const res = await api.put<WorkflowState>(`/workflow/states/${id}`, data);
  return res.data;
}

export async function deleteWorkflowState(id: string): Promise<void> {
  await api.delete(`/workflow/states/${id}`);
}

export async function fetchWorkflowTransitions(): Promise<WorkflowTransition[]> {
  const res = await api.get<WorkflowTransition[]>("/workflow/transitions");
  return res.data;
}

export async function createWorkflowTransition(data: {
  from_state: string;
  to_state: string;
  allowed_roles: string[];
}): Promise<WorkflowTransition> {
  const res = await api.post<WorkflowTransition>("/workflow/transitions", data);
  return res.data;
}

export async function updateWorkflowTransition(
  id: string,
  data: { from_state: string; to_state: string; allowed_roles: string[] }
): Promise<WorkflowTransition> {
  const res = await api.put<WorkflowTransition>(`/workflow/transitions/${id}`, data);
  return res.data;
}

export async function deleteWorkflowTransition(id: string): Promise<void> {
  await api.delete(`/workflow/transitions/${id}`);
}
