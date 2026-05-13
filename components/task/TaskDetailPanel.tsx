"use client";
import { useState } from "react";
import { X, Send, Loader2, Trash2, Calendar, User, Tag, Clock, ExternalLink, Edit2, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { timeAgo, formatDate, adfToText, getInitials, PRIORITY_CONFIG } from "@/lib/utils";
import type { PriorityName } from "@/types/jira";

export default function TaskDetailPanel() {
  const { selectedIssue, panelOpen, closePanel, updateIssueInStore, removeIssueFromStore } = useAppStore();
  const qc = useQueryClient();

  const [comment,     setComment]     = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editDesc,    setEditDesc]    = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc,  setEditingDesc]  = useState(false);

  if (!panelOpen || !selectedIssue) return null;

  const issue = selectedIssue;
  const pc = PRIORITY_CONFIG[issue.fields.priority?.name as PriorityName] ?? PRIORITY_CONFIG.Medium;
  const description = adfToText(issue.fields.description);

  const priorityDotColors: Record<string, string> = {
    Highest: "#FF4D4F", High: "#FF7A45", Medium: "#FFC53D", Low: "#73D13D", Lowest: "#40A9FF",
  };
  const priorityColor = priorityDotColors[issue.fields.priority?.name ?? "Medium"] ?? "#FFC53D";

  const commentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jira/issues/${issue.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: async () => {
      setComment("");
      const res = await fetch(`/api/jira/issues/${issue.id}`);
      const data = await res.json();
      if (data.issue) updateIssueInStore(data.issue);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: object) => {
      const res = await fetch(`/api/jira/issues/${issue.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.issue) updateIssueInStore(data.issue);
      setEditingTitle(false);
      setEditingDesc(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jira/issues/${issue.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      removeIssueFromStore(issue.id);
      qc.invalidateQueries({ queryKey: ["jira-issues"] });
    },
  });

  const s = (obj: React.CSSProperties) => obj;

  return (
    <>
      <div onClick={closePanel} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />

      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0, zIndex: 50,
        width: 480, display: "flex", flexDirection: "column",
        background: "#162435", borderLeft: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        animation: "slideInRight 0.25s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "#475569" }}>{issue.key}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: `${priorityColor}18`, color: priorityColor }}>
              {issue.fields.priority?.name ?? "Medium"}
            </span>
            <a href={`https://iotatechnologies.atlassian.net/browse/${issue.key}`} target="_blank" rel="noopener noreferrer"
              style={{ color: "#475569", display: "flex", marginLeft: 2 }} title="Open in Jira">
              <ExternalLink size={12} />
            </a>
            <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              <button onClick={() => { if (confirm("Delete this task from Jira?")) deleteMutation.mutate(); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 6, borderRadius: 8, display: "flex" }}
                title="Delete task">
                {deleteMutation.isPending ? <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> : <Trash2 size={14} />}
              </button>
              <button onClick={closePanel}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 6, borderRadius: 8, display: "flex" }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Editable title */}
          {editingTitle ? (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <textarea value={editSummary} onChange={e => setEditSummary(e.target.value)} rows={2}
                style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(30,111,217,0.5)", borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 14, fontWeight: 600, resize: "none", outline: "none", fontFamily: "inherit" }}
                autoFocus />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button onClick={() => updateMutation.mutate({ summary: editSummary })} disabled={updateMutation.isPending}
                  style={{ background: "#1E6FD9", border: "none", borderRadius: 6, padding: "6px 10px", color: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
                  {updateMutation.isPending ? "…" : "Save"}
                </button>
                <button onClick={() => setEditingTitle(false)}
                  style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "5px 10px", color: "#64748b", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}
              onClick={() => { setEditSummary(issue.fields.summary); setEditingTitle(true); }}>
              <h2 style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.4, margin: 0 }}>
                {issue.fields.summary}
              </h2>
              <Edit2 size={13} color="#475569" style={{ flexShrink: 0, marginTop: 2 }} />
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* Meta grid */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            {/* Priority */}
            <MetaItem icon={<span style={{ fontSize: 10 }}>⚡</span>} label="Priority">
              <select
                value={issue.fields.priority?.name ?? "Medium"}
                onChange={e => updateMutation.mutate({ priority: e.target.value })}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: priorityColor, fontSize: 12, fontWeight: 600, padding: "3px 6px", cursor: "pointer", outline: "none", fontFamily: "inherit", width: "100%" }}
              >
                {["Highest","High","Medium","Low","Lowest"].map(p => (
                  <option key={p} value={p} style={{ background: "#162435", color: "#e2e8f0" }}>{p}</option>
                ))}
              </select>
            </MetaItem>

            {/* Due date */}
            <MetaItem icon={<Calendar size={13} color="#475569" />} label="Due Date">
              <input
                type="date"
                value={issue.fields.duedate ?? ""}
                onChange={e => updateMutation.mutate({ duedate: e.target.value || null })}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: issue.fields.duedate ? "#e2e8f0" : "#475569", fontSize: 12, padding: "3px 6px", cursor: "pointer", outline: "none", fontFamily: "inherit", width: "100%", colorScheme: "dark" }}
              />
            </MetaItem>

            {/* Assignee */}
            <MetaItem icon={<User size={13} color="#475569" />} label="Assignee">
              {issue.fields.assignee ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {issue.fields.assignee.avatarUrls?.["24x24"] ? (
                    <img src={issue.fields.assignee.avatarUrls["24x24"]} style={{ width: 18, height: 18, borderRadius: "50%" }} alt="" />
                  ) : (
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(30,111,217,0.2)", color: "#4D96D9", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {getInitials(issue.fields.assignee.displayName)}
                    </div>
                  )}
                  <span style={{ fontSize: 12, color: "#e2e8f0" }}>{issue.fields.assignee.displayName}</span>
                </div>
              ) : <span style={{ fontSize: 12, color: "#475569" }}>Unassigned</span>}
            </MetaItem>

            <MetaItem icon={<Clock size={13} color="#475569" />} label="Updated">
              <span style={{ fontSize: 12, color: "#64748b" }}>{timeAgo(issue.fields.updated)}</span>
            </MetaItem>
          </div>

          {/* Labels */}
          {issue.fields.labels?.length > 0 && (
            <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Tag size={12} color="#475569" />
                <span style={{ fontSize: 10, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: 1 }}>Labels</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {issue.fields.labels.map(l => (
                  <span key={l} style={{ fontSize: 11, padding: "3px 8px", background: "rgba(0,194,203,0.1)", color: "#00C2CB", borderRadius: 6, fontWeight: 500 }}>{l}</span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: 1 }}>Description</span>
              {!editingDesc && (
                <button onClick={() => { setEditDesc(description); setEditingDesc(true); }}
                  style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 10px", color: "#64748b", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
                  <Edit2 size={10} /> Edit
                </button>
              )}
            </div>

            {editingDesc ? (
              <div>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={6}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(30,111,217,0.5)", borderRadius: 10, padding: "10px 12px", color: "#e2e8f0", fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => updateMutation.mutate({ description: editDesc })} disabled={updateMutation.isPending}
                    style={{ background: "#1E6FD9", border: "none", borderRadius: 8, padding: "7px 16px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                    {updateMutation.isPending ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setEditingDesc(false)}
                    style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 16px", color: "#64748b", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: description ? "#94a3b8" : "#475569", lineHeight: 1.7, margin: 0, fontStyle: description ? "normal" : "italic" }}>
                {description || "No description yet."}
              </p>
            )}
          </div>

          {/* Subtasks */}
          {issue.fields.subtasks?.length > 0 && (
            <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>
                Subtasks ({issue.fields.subtasks.length})
              </span>
              {issue.fields.subtasks.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8, marginBottom: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: s.fields.status.statusCategory.key === "done" ? "#10B981" : "#475569" }} />
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: "#475569" }}>{s.key}</span>
                  <span style={{ fontSize: 12, color: "#94a3b8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.fields.summary}</span>
                </div>
              ))}
            </div>
          )}

          {/* Comments */}
          <div style={{ padding: "14px 20px" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 12 }}>
              Comments ({issue.fields.comment?.total ?? 0})
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {issue.fields.comment?.comments?.slice(-10).map(c => (
                <div key={c.id} style={{ display: "flex", gap: 10 }}>
                  {c.author.avatarUrls?.["24x24"] ? (
                    <img src={c.author.avatarUrls["24x24"]} style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0 }} alt="" />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(30,111,217,0.2)", color: "#4D96D9", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {getInitials(c.author.displayName)}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1" }}>{c.author.displayName}</span>
                      <span style={{ fontSize: 10, color: "#475569" }}>{timeAgo(c.created)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 12px" }}>
                      {adfToText(c.body)}
                    </div>
                  </div>
                </div>
              ))}
              {(issue.fields.comment?.total ?? 0) === 0 && (
                <p style={{ fontSize: 12, color: "#475569", fontStyle: "italic", margin: 0 }}>No comments yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Comment input */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && comment.trim()) commentMutation.mutate(); }}
              placeholder="Add a comment… (Ctrl+Enter to send)"
              rows={2}
              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit" }} />
            <button onClick={() => comment.trim() && commentMutation.mutate()} disabled={!comment.trim() || commentMutation.isPending}
              style={{ alignSelf: "flex-end", background: comment.trim() ? "#1E6FD9" : "rgba(255,255,255,0.05)", border: "none", borderRadius: 10, padding: "10px 12px", cursor: comment.trim() ? "pointer" : "not-allowed", color: "#fff", display: "flex", transition: "all 0.15s" }}>
              {commentMutation.isPending ? <Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function MetaItem({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
        {icon}
        <span style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
      </div>
      {children}
    </div>
  );
}