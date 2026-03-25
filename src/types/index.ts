export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  tenant_id: string;
  roles: string[];
  permissions: string[];
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  due_date: string | null;
  resolved_at: string | null;
  is_overdue: boolean;
  tenant_id: string;
  created_by: string;
  assigned_to: string | null;
  creator_name: string | null;
  assignee_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueListResponse {
  items: Issue[];
  total: number;
  page: number;
  page_size: number;
}

export interface IssueCreate {
  title: string;
  description: string;
  category: string;
  priority: string;
  due_date?: string;
  assigned_to?: string;
}

export interface IssueUpdate {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  due_date?: string;
  assigned_to?: string;
}

export interface TransitionOption {
  to_state: string;
  state_name: string;
}

export interface WorkflowState {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_initial: boolean;
  is_terminal: boolean;
  tenant_id: string;
}

export interface WorkflowTransition {
  id: string;
  from_state: string;
  to_state: string;
  allowed_roles: string[];
  tenant_id: string;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  user_id: string;
  timestamp: string;
}

export interface AISummary {
  id: string;
  issue_id: string;
  version: number;
  content: string;
  model_used: string;
  generated_by: string;
  created_at: string;
}

export interface DashboardMetrics {
  total_issues: number;
  issues_by_status: { status: string; count: number }[];
  issues_by_category: { category: string; count: number }[];
  sla_breach_percentage: number;
  average_resolution_hours: number;
  overdue_count: number;
  resolved_count: number;
}

export interface SLAInfo {
  remaining_seconds: number | null;
  is_overdue: boolean;
}
