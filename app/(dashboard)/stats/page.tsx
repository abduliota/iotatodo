"use client";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, CheckCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import type { DashboardStats } from "@/types/jira";
import { cn, getInitials, PRIORITY_CONFIG } from "@/lib/utils";

export default function StatsPage() {
  const { data, isLoading } = useQuery<{ stats: DashboardStats }>({
    queryKey: ["jira-stats"],
    queryFn: () => fetch("/api/jira/stats").then(r => r.json()),
    refetchInterval: 2 * 60_000,
  });

  const stats = data?.stats;

  return (
    <div className="flex flex-col h-screen">
      <Topbar title="Stats" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 gap-3 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
            <span className="text-sm">Loading stats…</span>
          </div>
        ) : stats ? (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-4 gap-4">
              <KpiCard icon={<Clock className="w-4 h-4 text-brand-400" />}
                label="Open Tasks" value={stats.totalOpen} color="brand" />
              <KpiCard icon={<TrendingUp className="w-4 h-4 text-yellow-400" />}
                label="In Progress" value={stats.inProgress} color="yellow" />
              <KpiCard icon={<CheckCircle className="w-4 h-4 text-green-400" />}
                label="Completed Today" value={stats.completedToday} color="green" />
              <KpiCard icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
                label="Stale (3+ days)" value={stats.blocked} color="red" urgent={stats.blocked > 0} />
            </div>

            {/* Velocity + Status row */}
            <div className="grid grid-cols-5 gap-4">
              {/* Velocity chart */}
              <div className="col-span-3 bg-navy-50/80 border border-white/8 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Weekly Velocity</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={stats.velocity} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="gradComp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#1E6FD9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1E6FD9" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradCre" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#00C2CB" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#00C2CB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#162435", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }} />
                    <Area type="monotone" dataKey="completed" stroke="#1E6FD9" strokeWidth={2} fill="url(#gradComp)" name="Completed" />
                    <Area type="monotone" dataKey="created"   stroke="#00C2CB" strokeWidth={2} fill="url(#gradCre)"  name="Created" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Status donut */}
              <div className="col-span-2 bg-navy-50/80 border border-white/8 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">By Status</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={stats.byStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                      dataKey="value" paddingAngle={3}>
                      {stats.byStatus.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#162435", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8}
                      formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Priority + Workload row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Priority bar chart */}
              <div className="bg-navy-50/80 border border-white/8 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Priority Distribution</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={stats.byPriority} margin={{ top: 0, right: 0, bottom: 0, left: -20 }} barSize={20}>
                    <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#162435", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {stats.byPriority.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Assignee workload */}
              <div className="bg-navy-50/80 border border-white/8 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Assignee Workload</h3>
                <div className="space-y-3">
                  {stats.assigneeWorkload.slice(0, 6).map((aw) => (
                    <div key={aw.assignee.accountId} className="flex items-center gap-3">
                      {aw.assignee.avatarUrls?.["24x24"] ? (
                        <img src={aw.assignee.avatarUrls["24x24"]} className="w-6 h-6 rounded-full flex-shrink-0" alt="" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-brand-400/20 text-brand-300 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                          {getInitials(aw.assignee.displayName)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-300 truncate">{aw.assignee.displayName}</span>
                          <span className="text-xs text-slate-500 ml-2">{aw.total}</span>
                        </div>
                        <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5">
                          <div className="bg-brand-400" style={{ width: `${(aw.inProgress / aw.total) * 100}%` }} />
                          <div className="bg-slate-600" style={{ width: `${(aw.todo / aw.total) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {stats.assigneeWorkload.length === 0 && (
                    <p className="text-xs text-slate-600 italic">No assigned tasks.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-red-400">Failed to load stats.</p>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, color, urgent }: {
  icon: React.ReactNode; label: string; value: number; color: string; urgent?: boolean;
}) {
  const colors: Record<string, string> = {
    brand: "border-brand-400/20 bg-brand-400/5",
    yellow: "border-yellow-400/20 bg-yellow-400/5",
    green: "border-green-400/20 bg-green-400/5",
    red: "border-red-400/20 bg-red-400/5",
  };
  return (
    <div className={cn("stat-card rounded-2xl p-5 border", colors[color] ?? colors.brand,
      urgent && "ring-1 ring-red-400/30")}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-white/5 rounded-xl">{icon}</div>
        {urgent && <span className="text-[10px] text-red-400 font-semibold bg-red-400/10 px-2 py-0.5 rounded-full">Attention</span>}
      </div>
      <div className="text-3xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
