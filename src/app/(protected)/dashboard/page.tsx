"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardMetrics } from "@/services/dashboard";
import { useAuth } from "@/store/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "#94a3b8",
  submitted: "#60a5fa",
  under_review: "#f59e0b",
  approved: "#22c55e",
  closed: "#8b5cf6",
  rejected: "#ef4444",
};

const CATEGORY_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e", "#ef4444"];

export default function DashboardPage() {
  const user = useAuth((s) => s.user);
  const { data: metrics, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardMetrics,
  });

  const handleWSMessage = useCallback(() => {
    refetch();
  }, [refetch]);

  useWebSocket(user?.tenant_id, handleWSMessage);

  if (!metrics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Issues", value: metrics.total_issues, icon: AlertTriangle, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Overdue", value: metrics.overdue_count, icon: Clock, color: "text-red-600", bg: "bg-red-50" },
    { label: "Resolved", value: metrics.resolved_count, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "SLA Breach %", value: `${metrics.sla_breach_percentage}%`, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Real-time compliance metrics overview</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${card.bg}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Issues by Status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.issues_by_status}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ status, count }) => `${status} (${count})`}
                >
                  {metrics.issues_by_status.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Issues by Category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.issues_by_category}>
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Issues">
                  {metrics.issues_by_category.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="text-center">
            <p className="text-3xl font-bold text-brand-600">{metrics.average_resolution_hours}h</p>
            <p className="mt-1 text-sm text-gray-500">Avg Resolution Time</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{metrics.resolved_count}</p>
            <p className="mt-1 text-sm text-gray-500">Issues Resolved</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">{metrics.sla_breach_percentage}%</p>
            <p className="mt-1 text-sm text-gray-500">SLA Breach Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
