"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchWorkflowStates,
  fetchWorkflowTransitions,
  createWorkflowState,
  deleteWorkflowState,
  createWorkflowTransition,
  deleteWorkflowTransition,
} from "@/services/workflow";
import { GitBranch, Plus, Trash2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function WorkflowAdminPage() {
  const queryClient = useQueryClient();
  const [showAddState, setShowAddState] = useState(false);
  const [showAddTransition, setShowAddTransition] = useState(false);

  const { data: states } = useQuery({
    queryKey: ["workflow-states"],
    queryFn: fetchWorkflowStates,
  });

  const { data: transitions } = useQuery({
    queryKey: ["workflow-transitions"],
    queryFn: fetchWorkflowTransitions,
  });

  const addStateMutation = useMutation({
    mutationFn: createWorkflowState,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-states"] });
      setShowAddState(false);
      toast.success("State added");
    },
    onError: () => toast.error("Failed to add state"),
  });

  const deleteStateMutation = useMutation({
    mutationFn: deleteWorkflowState,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-states"] });
      toast.success("State deleted");
    },
  });

  const addTransitionMutation = useMutation({
    mutationFn: createWorkflowTransition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-transitions"] });
      setShowAddTransition(false);
      toast.success("Transition added");
    },
    onError: () => toast.error("Failed to add transition"),
  });

  const deleteTransitionMutation = useMutation({
    mutationFn: deleteWorkflowTransition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-transitions"] });
      toast.success("Transition deleted");
    },
  });

  const handleAddState = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addStateMutation.mutate({
      name: fd.get("name") as string,
      slug: fd.get("slug") as string,
      display_order: parseInt(fd.get("display_order") as string) || 0,
      is_initial: fd.get("is_initial") === "on",
      is_terminal: fd.get("is_terminal") === "on",
    });
  };

  const handleAddTransition = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const rolesStr = fd.get("allowed_roles") as string;
    addTransitionMutation.mutate({
      from_state: fd.get("from_state") as string,
      to_state: fd.get("to_state") as string,
      allowed_roles: rolesStr.split(",").map((r) => r.trim()).filter(Boolean),
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workflow Configuration</h1>
        <p className="text-sm text-gray-500">Configure workflow states and transitions for your organization</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-gray-900">Workflow States</h2>
          </div>
          <button
            onClick={() => setShowAddState(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Add State
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Order</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {states?.map((state) => (
                <tr key={state.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{state.name}</td>
                  <td className="px-4 py-3 text-gray-500">{state.slug}</td>
                  <td className="px-4 py-3 text-gray-500">{state.display_order}</td>
                  <td className="px-4 py-3">
                    {state.is_initial && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Initial</span>}
                    {state.is_terminal && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Terminal</span>}
                    {!state.is_initial && !state.is_terminal && <span className="text-xs text-gray-400">Intermediate</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteStateMutation.mutate(state.id)}
                      className="rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-gray-900">Transitions</h2>
          </div>
          <button
            onClick={() => setShowAddTransition(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Add Transition
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">From</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500"></th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">To</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Allowed Roles</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transitions?.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.from_state}</td>
                  <td className="px-4 py-3"><ArrowRight className="h-4 w-4 text-gray-400" /></td>
                  <td className="px-4 py-3 font-medium text-gray-900">{t.to_state}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {t.allowed_roles.map((role) => (
                        <span key={role} className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteTransitionMutation.mutate(t.id)}
                      className="rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Add Workflow State</h2>
            <form onSubmit={handleAddState} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input name="name" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" placeholder="e.g. Under Review" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Slug</label>
                <input name="slug" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" placeholder="e.g. under_review" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Display Order</label>
                <input name="display_order" type="number" defaultValue={0} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input name="is_initial" type="checkbox" className="rounded" />
                  Initial State
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input name="is_terminal" type="checkbox" className="rounded" />
                  Terminal State
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddState(false)} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={addStateMutation.isPending} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
                  {addStateMutation.isPending ? "Adding..." : "Add State"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddTransition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Add Transition</h2>
            <form onSubmit={handleAddTransition} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">From State (slug)</label>
                <select name="from_state" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {states?.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">To State (slug)</label>
                <select name="to_state" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {states?.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Allowed Roles (comma-separated)</label>
                <input name="allowed_roles" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" placeholder="admin, manager, reviewer" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddTransition(false)} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={addTransitionMutation.isPending} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
                  {addTransitionMutation.isPending ? "Adding..." : "Add Transition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
