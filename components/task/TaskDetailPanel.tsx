"use client";
import { useState } from "react";
import { X, Send, Loader2, Trash2, Calendar, User, Tag, Clock, ExternalLink } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { cn, PRIORITY_CONFIG, timeAgo, formatDate, adfToText, getInitials } from "@/lib/utils";
import type { PriorityName } from "@/types/jira";

export default function TaskDetailPanel() {
  const { selectedIssue, panelOpen, closePanel, updateIssueInStore, removeIssueFromStore } = useAppStore();
  const qc = useQueryClient();

  const [comment,  setComment]  = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editSummary, setEditSummary] = useState("");
  const [editDesc,    setEditDesc]    = useState("");

  if (!panelOpen || !selectedIssue) return null;

  const issue = selectedIssue;
  const pc = PRIORITY_CONFIG[issue.fields.priority?.name as PriorityName] ?? PRIORITY_CONFIG.Medium;
  const description = adfToText(issue.fields.description);

  // ── Mutations ──────────────────────────────────────────────────────────
  const commentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jira/issues/${issue.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      return res.json();
    },
    onSuccess: async () => {
      setComment("");
      // Refresh issue
      const res = await fetch(`/api/jira/issues/${issue.id}`);
      const data = await res.json();
      updateIssueInStore(data.issue);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: object) => {
      const res = await fetch(`/api/jira/issues/${issue.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: (data) => {
      updateIssueInStore(data.issue);
      setEditMode(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jira/issues/${issue.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      removeIssueFromStore(issue.id);
      qc.invalidateQueries({ queryKey: ["jira-issues"] });
    },
  });

  const startEdit = () => {
    setEditSummary(issue.fields.summary);
    setEditDesc(description);
    setEditMode(true);
  };

  const saveEdit = () => {
    updateMutation.mutate({ summary: editSummary, description: editDesc });
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/30 modal-overlay" onClick={closePanel} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[480px] flex flex-col bg-navy-50 border-l border-white/8 shadow-2xl shadow-black/40 animate-slide-in-right">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/8 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-slate-500">{issue.key}</span>
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md", pc.color, pc.bg)}>
                {issue.fields.priority?.name ?? "Medium"}
              </span>
              <a
                href={`https://jira.atlassian.net/browse/${issue.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-brand-400 transition-colors"
                title="Open in Jira"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {editMode ? (
              <input
                value={editSummary}
                onChange={e => setEditSummary(e.target.value)}
                className="w-full bg-white/5 border border-brand-400/40 rounded-lg px-2 py-1 text-sm font-semibold text-white focus:outline-none"
                autoFocus
              />
            ) : (
              <h2
                onClick={startEdit}
                className="text-sm font-semibold text-white cursor-text hover:text-brand-200 transition-colors leading-snug"
                title="Click to edit"
              >
                {issue.fields.summary}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => { if (confirm("Delete this task?")) deleteMutation.mutate(); }}
              className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title="Delete task"
            >
              {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
            <button onClick={closePanel} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Meta grid */}
          <div className="px-5 py-4 grid grid-cols-2 gap-3 border-b border-white/6">
            <MetaRow icon={<User className="w-3.5 h-3.5" />} label="Assignee">
              {issue.fields.assignee ? (
                <div className="flex items-center gap-1.5">
                  {issue.fields.assignee.avatarUrls?.["16x16"] ? (
                    <img src={issue.fields.assignee.avatarUrls["16x16"]} className="w-4 h-4 rounded-full" alt="" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-brand-400/20 text-brand-300 text-[8px] font-bold flex items-center justify-center">
                      {getInitials(issue.fields.assignee.displayName)}
                    </div>
                  )}
                  <span className="text-xs text-slate-200 truncate">{issue.fields.assignee.displayName}</span>
                </div>
              ) : <span className="text-xs text-slate-500">Unassigned</span>}
            </MetaRow>

            <MetaRow icon={<Calendar className="w-3.5 h-3.5" />} label="Due Date">
              <span className={cn("text-xs", issue.fields.duedate ? "text-slate-200" : "text-slate-500")}>
                {formatDate(issue.fields.duedate)}
              </span>
            </MetaRow>

            <MetaRow icon={<Clock className="w-3.5 h-3.5" />} label="Created">
              <span className="text-xs text-slate-400">{timeAgo(issue.fields.created)}</span>
            </MetaRow>

            <MetaRow icon={<Clock className="w-3.5 h-3.5" />} label="Updated">
              <span className="text-xs text-slate-400">{timeAgo(issue.fields.updated)}</span>
            </MetaRow>
          </div>

          {/* Labels */}
          {issue.fields.labels.length > 0 && (
            <div className="px-5 py-3 border-b border-white/6">
              <div className="flex items-center gap-1.5 mb-2">
                <Tag className="w-3 h-3 text-slate-500" />
                <span className="text-xs font-medium text-slate-500">Labels</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {issue.fields.labels.map(l => (
                  <span key={l} className="text-[11px] px-2 py-0.5 bg-teal-200/10 text-teal-200 rounded-md font-medium">
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="px-5 py-4 border-b border-white/6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">Description</span>
              {editMode && (
                <div className="flex gap-2">
                  <button onClick={() => setEditMode(false)} className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
                  <button onClick={saveEdit} disabled={updateMutation.isPending}
                    className="text-xs text-brand-400 hover:text-brand-300 font-medium">
                    {updateMutation.isPending ? "Saving…" : "Save"}
                  </button>
                </div>
              )}
            </div>
            {editMode ? (
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                rows={5}
                className="w-full bg-white/5 border border-brand-400/40 rounded-xl px-3 py-2 text-sm text-white focus:outline-none resize-none"
              />
            ) : (
              <p
                onClick={startEdit}
                className={cn("text-sm leading-relaxed cursor-text hover:text-slate-200 transition-colors",
                  description ? "text-slate-300" : "text-slate-600 italic")}
                title="Click to edit"
              >
                {description || "No description. Click to add one."}
              </p>
            )}
          </div>

          {/* Subtasks */}
          {issue.fields.subtasks.length > 0 && (
            <div className="px-5 py-4 border-b border-white/6">
              <span className="text-xs font-medium text-slate-500 block mb-2">
                Subtasks ({issue.fields.subtasks.length})
              </span>
              <div className="space-y-1.5">
                {issue.fields.subtasks.map(s => (
                  <div key={s.id} className="flex items-center gap-2 text-xs text-slate-400 bg-white/4 rounded-lg px-3 py-2">
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0",
                      s.fields.status.statusCategory.key === "done" ? "bg-green-400" : "bg-slate-500")} />
                    <span className="font-mono text-slate-600 flex-shrink-0">{s.key}</span>
                    <span className="flex-1 truncate">{s.fields.summary}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="px-5 py-4">
            <span className="text-xs font-medium text-slate-500 block mb-3">
              Comments ({issue.fields.comment.total})
            </span>
            <div className="space-y-4">
              {issue.fields.comment.comments.slice(-10).map(c => (
                <div key={c.id} className="flex gap-3">
                  {c.author.avatarUrls?.["24x24"] ? (
                    <img src={c.author.avatarUrls["24x24"]} className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5" alt="" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-brand-400/20 text-brand-300 text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getInitials(c.author.displayName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-300">{c.author.displayName}</span>
                      <span className="text-[10px] text-slate-600">{timeAgo(c.created)}</span>
                    </div>
                    <div className="text-xs text-slate-400 leading-relaxed bg-white/4 rounded-xl px-3 py-2">
                      {adfToText(c.body)}
                    </div>
                  </div>
                </div>
              ))}

              {issue.fields.comment.total === 0 && (
                <p className="text-xs text-slate-600 italic">No comments yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Comment input */}
        <div className="px-5 py-4 border-t border-white/8 flex-shrink-0">
          <div className="flex gap-2">
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (comment.trim()) commentMutation.mutate(); }}}
              placeholder="Add a comment… (⌘Enter to send)"
              rows={2}
              className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-400/50 transition-colors resize-none"
            />
            <button
              onClick={() => comment.trim() && commentMutation.mutate()}
              disabled={!comment.trim() || commentMutation.isPending}
              className="self-end p-2.5 bg-brand-400 hover:bg-brand-300 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all"
            >
              {commentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function MetaRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1 text-slate-500">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      {children}
    </div>
  );
}
