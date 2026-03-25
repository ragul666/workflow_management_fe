"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchIssues, createIssue } from "@/services/issues";
import { useAuth } from "@/store/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { clsx } from "clsx";
import { Plus, Search, Filter, Clock, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import type { IssueCreate } from "@/types";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  under_review: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  closed: "bg-purple-100 text-purple-700",
  rejected: "bg-red-100 text-red-700",
};

const PRIORITY_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

export default function IssuesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["issues", page, statusFilter],
    queryFn: () => fetchIssues({ page, page_size: 20, status: statusFilter || undefined }),
  });

  const handleWSMessage = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["issues"] });
  }, [queryClient]);

  useWebSocket(user?.tenant_id, handleWSMessage);

  const createMutation = useMutation({
    mutationFn: (data: IssueCreate) => createIssue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      setShowCreate(false);
      toast.success("Issue created");
    },
    onError: () => toast.error("Failed to create issue"),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      category: fd.get("category") as string,
      priority: fd.get("priority") as string,
      due_date: fd.get("due_date") ? new Date(fd.get("due_date") as string).toISOString() : undefined,
    });
  };

  const statuses = ["", "draft", "submitted", "under_review", "approved", "closed", "rejected"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issues</h1>
          <p className="text-sm text-gray-500">{data?.total || 0} total issues</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New Issue
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <div className="flex gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={clsx(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                statusFilter === s ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {data?.items.map((issue) => (
            <div
              key={issue.id}
              onClick={() => router.push(`/issues/${issue.id}`)}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-900">{issue.title}</h3>
                    {issue.is_overdue && (
                      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        <Clock className="h-3 w-3" />
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{issue.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_BADGE[issue.status] || "bg-gray-100")}>
                      {issue.status.replace("_", " ")}
                    </span>
                    <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-medium", PRIORITY_BADGE[issue.priority] || "bg-gray-100")}>
                      {issue.priority}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      {issue.category}
                    </span>
                  </div>
                </div>
                <div className="ml-4 text-right text-xs text-gray-400">
                  <p>{new Date(issue.created_at).toLocaleDateString()}</p>
                  {issue.creator_name && <p className="mt-1">by {issue.creator_name}</p>}
                </div>
              </div>
            </div>
          ))}

          {data && data.total > 20 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page}</span>
              <button
                disabled={page * 20 >= data.total}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Create Issue</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                <input name="title" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" rows={4} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                  <select name="category" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="compliance">Compliance</option>
                    <option value="quality">Quality</option>
                    <option value="safety">Safety</option>
                    <option value="regulatory">Regulatory</option>
                    <option value="operational">Operational</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
                  <select name="priority" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Due Date</label>
                <input name="due_date" type="datetime-local" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
                  {createMutation.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
