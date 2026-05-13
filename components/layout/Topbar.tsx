"use client";
import { Search, Plus, SlidersHorizontal, Bell, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useQuery } from "@tanstack/react-query";
import type { JiraUser } from "@/types/jira";
import { PRIORITY_CONFIG } from "@/lib/utils";
import { useState } from "react";

export default function Topbar({ title }: { title: string }) {
  const {
    search, setSearch,
    filterAssignee, setFilterAssignee,
    filterPriority, setFilterPriority,
    openCreateModal,
  } = useAppStore();
  const [showFilters, setShowFilters] = useState(false);

  const { data: usersData } = useQuery<{ users: JiraUser[] }>({
    queryKey: ["jira-users"],
    queryFn: () => fetch("/api/jira/users").then(r => r.json()),
    staleTime: 5 * 60_000,
  });

  const hasFilters = !!filterAssignee || !!filterPriority;

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 px-6 py-3.5 bg-navy-100/80 border-b border-white/6 backdrop-blur-sm">
      <h1 className="text-base font-semibold text-white mr-2">{title}</h1>

      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          placeholder="Search tasks…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-400/50 focus:bg-white/8 transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Filter toggle */}
      <button
        onClick={() => setShowFilters(v => !v)}
        className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all ${
          showFilters || hasFilters
            ? "bg-brand-400/10 border-brand-400/30 text-brand-300"
            : "bg-white/5 border-white/8 text-slate-400 hover:text-slate-200 hover:bg-white/8"
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Filters
        {hasFilters && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-400 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            {(filterAssignee ? 1 : 0) + (filterPriority ? 1 : 0)}
          </span>
        )}
      </button>

      {/* Notification bell */}
      <button className="p-2 rounded-xl bg-white/5 border border-white/8 text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-all">
        <Bell className="w-4 h-4" />
      </button>

      {/* Create task */}
      <button
        onClick={openCreateModal}
        className="flex items-center gap-1.5 px-4 py-2 bg-brand-400 hover:bg-brand-300 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-brand-400/20"
      >
        <Plus className="w-4 h-4" />
        New Task
      </button>

      {/* Filter dropdown */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 px-6 py-3 bg-navy-50 border-b border-white/6 flex items-center gap-4 animate-fade-in">
          {/* Assignee filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Assignee</span>
            <select
              value={filterAssignee ?? ""}
              onChange={e => setFilterAssignee(e.target.value || null)}
              className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-brand-400/50"
            >
              <option value="">All</option>
              {usersData?.users.map(u => (
                <option key={u.accountId} value={u.accountId}>{u.displayName}</option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Priority</span>
            <select
              value={filterPriority ?? ""}
              onChange={e => setFilterPriority(e.target.value || null)}
              className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-brand-400/50"
            >
              <option value="">All</option>
              {Object.keys(PRIORITY_CONFIG).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={() => { setFilterAssignee(null); setFilterPriority(null); }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </header>
  );
}
