"use client";
import { Search, Plus, SlidersHorizontal, Bell, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useQuery } from "@tanstack/react-query";
import type { JiraUser } from "@/types/jira";
import { PRIORITY_CONFIG } from "@/lib/utils";
import { useState } from "react";

export default function Topbar({ title }: { title: string }) {
  const { search, setSearch, filterAssignee, setFilterAssignee, filterPriority, setFilterPriority, openCreateModal } = useAppStore();
  const [showFilters, setShowFilters] = useState(false);

  const { data: usersData } = useQuery<{ users: JiraUser[] }>({
    queryKey: ["jira-users"],
    queryFn: () => fetch("/api/jira/users").then(r => r.json()),
    staleTime: 5 * 60_000,
  });

  const hasFilters = !!filterAssignee || !!filterPriority;

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, color: "#e2e8f0", fontSize: 13,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    outline: "none",
  };

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 20,
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 24px",
      background: "rgba(22,36,53,0.95)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      backdropFilter: "blur(10px)",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      flexWrap: "wrap",
    }}>
      <h1 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginRight: 8, whiteSpace: "nowrap" }}>{title}</h1>

      {/* Search */}
      <div style={{ position: "relative", flex: 1, maxWidth: 320, minWidth: 160 }}>
        <Search size={13} color="#475569" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
        <input type="text" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width: "100%", paddingLeft: 32, paddingRight: 32, paddingTop: 8, paddingBottom: 8 }} />
        {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#475569" }}><X size={12} /></button>}
      </div>

      {/* Filter button */}
      <button onClick={() => setShowFilters(v => !v)} style={{
        ...inputStyle, display: "flex", alignItems: "center", gap: 6,
        padding: "8px 12px", cursor: "pointer", whiteSpace: "nowrap",
        color: showFilters || hasFilters ? "#4D96D9" : "#64748b",
        background: showFilters || hasFilters ? "rgba(30,111,217,0.1)" : "rgba(255,255,255,0.05)",
        borderColor: showFilters || hasFilters ? "rgba(30,111,217,0.3)" : "rgba(255,255,255,0.08)",
        position: "relative",
      }}>
        <SlidersHorizontal size={13} />
        <span style={{ fontSize: 13 }}>Filters</span>
        {hasFilters && <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#1E6FD9", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{(filterAssignee ? 1 : 0) + (filterPriority ? 1 : 0)}</span>}
      </button>

      <button style={{ ...inputStyle, padding: "8px 10px", cursor: "pointer", color: "#64748b", display: "flex" }}>
        <Bell size={15} />
      </button>

      <button onClick={openCreateModal} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
        background: "linear-gradient(135deg, #1E6FD9, #1558B0)", border: "none",
        borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600,
        cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
        boxShadow: "0 4px 12px rgba(30,111,217,0.3)",
      }}>
        <Plus size={14} />
        New Task
      </button>

      {/* Filter row */}
      {showFilters && (
        <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, paddingTop: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>ASSIGNEE</span>
            <select value={filterAssignee ?? ""} onChange={e => setFilterAssignee(e.target.value || null)}
              style={{ ...inputStyle, padding: "6px 10px", fontSize: 12 }}>
              <option value="">All</option>
              {usersData?.users?.map(u => <option key={u.accountId} value={u.accountId}>{u.displayName}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>PRIORITY</span>
            <select value={filterPriority ?? ""} onChange={e => setFilterPriority(e.target.value || null)}
              style={{ ...inputStyle, padding: "6px 10px", fontSize: 12 }}>
              <option value="">All</option>
              {Object.keys(PRIORITY_CONFIG).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {hasFilters && <button onClick={() => { setFilterAssignee(null); setFilterPriority(null); }} style={{ fontSize: 12, color: "#f87171", background: "none", border: "none", cursor: "pointer" }}>Clear</button>}
        </div>
      )}
    </header>
  );
}