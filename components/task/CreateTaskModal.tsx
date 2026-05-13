"use client";
import { useState } from "react";
import { X, Loader2, Plus, Tag } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import type { JiraUser, PriorityName } from "@/types/jira";
import { PRIORITY_CONFIG } from "@/lib/utils";

const PRIORITIES: PriorityName[] = ["Highest", "High", "Medium", "Low", "Lowest"];

export default function CreateTaskModal() {
  const { closeCreateModal, addIssueToStore } = useAppStore();
  const qc = useQueryClient();

  const [summary,     setSummary]     = useState("");
  const [description, setDescription] = useState("");
  const [priority,    setPriority]    = useState<PriorityName>("Medium");
  const [assigneeId,  setAssigneeId]  = useState<string>("");
  const [duedate,     setDuedate]     = useState("");
  const [labelInput,  setLabelInput]  = useState("");
  const [labels,      setLabels]      = useState<string[]>([]);

  const { data: usersData } = useQuery<{ users: JiraUser[] }>({
    queryKey: ["jira-users"],
    queryFn: () => fetch("/api/jira/users").then(r => r.json()),
    staleTime: 5 * 60_000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/jira/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary, description, priority,
          assigneeId: assigneeId || null,
          duedate: duedate || null,
          labels,
        }),
      });
      if (!res.ok) throw new Error("Failed to create issue");
      return res.json();
    },
    onSuccess: (data) => {
      addIssueToStore(data.issue);
      qc.invalidateQueries({ queryKey: ["jira-issues"] });
      closeCreateModal();
    },
  });

  const addLabel = () => {
    const l = labelInput.trim();
    if (l && !labels.includes(l)) { setLabels(prev => [...prev, l]); }
    setLabelInput("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-black/60 animate-fade-in">
      <div
        className="bg-navy-50 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/40 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="text-base font-semibold text-white">Create New Task</h2>
          <button onClick={closeCreateModal} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Summary */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Title *</label>
            <input
              type="text"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-400/60 transition-colors"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add more details…"
              rows={3}
              className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-400/60 transition-colors resize-none"
            />
          </div>

          {/* Priority + Assignee row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Priority</label>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITIES.map(p => {
                  const pc = PRIORITY_CONFIG[p];
                  return (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`text-xs px-2 py-1 rounded-lg font-medium transition-all ${
                        priority === p
                          ? `${pc.color} ${pc.bg} ring-1 ring-current`
                          : "text-slate-500 bg-white/5 hover:text-slate-300"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Assignee</label>
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-400/60 transition-colors"
              >
                <option value="">Unassigned</option>
                {usersData?.users.map(u => (
                  <option key={u.accountId} value={u.accountId}>{u.displayName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Due Date</label>
            <input
              type="date"
              value={duedate}
              onChange={e => setDuedate(e.target.value)}
              className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-400/60 transition-colors"
            />
          </div>

          {/* Labels */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Labels</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={labelInput}
                onChange={e => setLabelInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLabel(); } }}
                placeholder="Add label…"
                className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-400/60 transition-colors"
              />
              <button onClick={addLabel} className="px-3 py-2 bg-white/5 border border-white/8 rounded-xl text-slate-400 hover:text-slate-200 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {labels.map(l => (
                  <span key={l} className="flex items-center gap-1 text-xs px-2 py-1 bg-teal-200/10 text-teal-200 rounded-lg">
                    <Tag className="w-2.5 h-2.5" />
                    {l}
                    <button onClick={() => setLabels(prev => prev.filter(x => x !== l))} className="hover:text-red-400 transition-colors ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/8">
          <button
            onClick={closeCreateModal}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!summary.trim() || createMutation.isPending}
            className="flex items-center gap-2 px-5 py-2 bg-brand-400 hover:bg-brand-300 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-brand-400/20"
          >
            {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Create Task
          </button>
        </div>

        {createMutation.isError && (
          <p className="text-xs text-red-400 text-center pb-3">Failed to create task. Please try again.</p>
        )}
      </div>
    </div>
  );
}
