"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchIssue,
  fetchTransitions,
  transitionIssue,
  fetchIssueAudit,
  fetchIssueSLA,
  updateIssue,
} from "@/services/issues";
import { generateSummary, fetchSummaries } from "@/services/ai";
import { useAuth } from "@/store/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { clsx } from "clsx";
import {
  ArrowLeft,
  Clock,
  History,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  under_review: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  closed: "bg-purple-100 text-purple-700",
  rejected: "bg-red-100 text-red-700",
};

function SLACountdown({ issueId }: { issueId: string }) {
  const { data: sla, refetch } = useQuery({
    queryKey: ["sla", issueId],
    queryFn: () => fetchIssueSLA(issueId),
    refetchInterval: 30000,
  });

  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (sla?.remaining_seconds != null) {
      setRemaining(sla.remaining_seconds);
      const interval = setInterval(() => {
        setRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sla]);

  if (remaining === null) return <span className="text-sm text-gray-400">No due date</span>;

  if (sla?.is_overdue || remaining <= 0) {
    return (
      <span className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
        <AlertTriangle className="h-4 w-4" />
        SLA Breached
      </span>
    );
  }

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  return (
    <span className="flex items-center gap-1.5 text-sm font-medium text-amber-600">
      <Clock className="h-4 w-4" />
      {hours}h {minutes}m {seconds}s remaining
    </span>
  );
}

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);
  const issueId = params.id as string;
  const [activeTab, setActiveTab] = useState<"details" | "audit" | "ai">("details");

  const { data: issue, isLoading } = useQuery({
    queryKey: ["issue", issueId],
    queryFn: () => fetchIssue(issueId),
  });

  const { data: transitions } = useQuery({
    queryKey: ["transitions", issueId, issue?.status],
    queryFn: () => fetchTransitions(issueId),
    enabled: !!issue,
  });

  const { data: auditData } = useQuery({
    queryKey: ["audit", issueId],
    queryFn: () => fetchIssueAudit(issueId),
    enabled: activeTab === "audit",
  });

  const { data: summariesData } = useQuery({
    queryKey: ["summaries", issueId],
    queryFn: () => fetchSummaries(issueId),
    enabled: activeTab === "ai",
  });

  const handleWSMessage = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["issue", issueId] });
    queryClient.invalidateQueries({ queryKey: ["transitions", issueId] });
    queryClient.invalidateQueries({ queryKey: ["audit", issueId] });
  }, [queryClient, issueId]);

  useWebSocket(user?.tenant_id, handleWSMessage);

  const transitionMutation = useMutation({
    mutationFn: (targetState: string) => transitionIssue(issueId, targetState),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue", issueId] });
      queryClient.invalidateQueries({ queryKey: ["transitions", issueId] });
      queryClient.invalidateQueries({ queryKey: ["audit", issueId] });
      toast.success("Status updated");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Transition failed");
    },
  });

  const aiMutation = useMutation({
    mutationFn: () => generateSummary(issueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summaries", issueId] });
      toast.success("AI summary generated");
    },
    onError: () => toast.error("Failed to generate summary"),
  });

  if (isLoading || !issue) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button
        onClick={() => router.push("/issues")}
        className="flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Issues
      </button>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", STATUS_BADGE[issue.status] || "bg-gray-100")}>
                {issue.status.replace("_", " ")}
              </span>
              {issue.is_overdue && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Overdue</span>
              )}
            </div>
            <h1 className="mt-3 text-xl font-bold text-gray-900">{issue.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{issue.description}</p>
          </div>
          <div className="ml-6 text-right">
            <SLACountdown issueId={issueId} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-gray-500">Category</p>
            <p className="mt-0.5 text-sm font-semibold capitalize text-gray-900">{issue.category}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Priority</p>
            <p className="mt-0.5 text-sm font-semibold capitalize text-gray-900">{issue.priority}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Created By</p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">{issue.creator_name || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Assigned To</p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">{issue.assignee_name || "Unassigned"}</p>
          </div>
        </div>

        {transitions && transitions.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-5">
            <p className="mb-3 text-sm font-semibold text-gray-700">Available Transitions</p>
            <div className="flex flex-wrap gap-2">
              {transitions.map((t) => (
                <button
                  key={t.to_state}
                  onClick={() => transitionMutation.mutate(t.to_state)}
                  disabled={transitionMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-100 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                  {t.state_name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {(["details", "audit", "ai"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition",
              activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab === "details" && "Details"}
            {tab === "audit" && "Audit Trail"}
            {tab === "ai" && "AI Summary"}
          </button>
        ))}
      </div>

      {activeTab === "details" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Issue Details</h3>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Created At</p>
                <p className="text-sm font-medium text-gray-900">{new Date(issue.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Updated At</p>
                <p className="text-sm font-medium text-gray-900">{new Date(issue.updated_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Due Date</p>
                <p className="text-sm font-medium text-gray-900">{issue.due_date ? new Date(issue.due_date).toLocaleString() : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Resolved At</p>
                <p className="text-sm font-medium text-gray-900">{issue.resolved_at ? new Date(issue.resolved_at).toLocaleString() : "—"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Audit Trail</h3>
          </div>
          <div className="mt-4 space-y-3">
            {auditData?.items.length === 0 && <p className="text-sm text-gray-400">No audit records yet</p>}
            {auditData?.items.map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100">
                  <User className="h-4 w-4 text-brand-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{log.action}</p>
                    <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                  {log.field_name && (
                    <p className="mt-1 text-xs text-gray-500">
                      <span className="font-medium">{log.field_name}</span>:{" "}
                      {log.old_value && <span className="text-red-500 line-through">{log.old_value}</span>}
                      {log.old_value && " → "}
                      <span className="text-green-600">{log.new_value}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900">AI Root Cause Summary</h3>
            </div>
            <button
              onClick={() => aiMutation.mutate()}
              disabled={aiMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {aiMutation.isPending ? "Generating..." : "Generate Summary"}
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {summariesData?.items.length === 0 && (
              <p className="text-sm text-gray-400">No AI summaries generated yet. Click the button above to generate one.</p>
            )}
            {summariesData?.items.map((summary) => (
              <div key={summary.id} className="rounded-lg border border-purple-100 bg-purple-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-700">Version {summary.version}</span>
                  <span className="text-xs text-gray-400">{new Date(summary.created_at).toLocaleString()}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{summary.content}</p>
                <p className="mt-2 text-xs text-gray-400">Model: {summary.model_used}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
