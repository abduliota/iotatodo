"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MessageSquare, Paperclip, Calendar } from "lucide-react";
import type { JiraIssue } from "@/types/jira";
import { useAppStore } from "@/store/useAppStore";
import { cn, PRIORITY_CONFIG, formatDate, isOverdue, getInitials } from "@/lib/utils";

export default function TaskCard({ issue }: { issue: JiraIssue }) {
  const openPanel = useAppStore(s => s.openPanel);
  const priority  = issue.fields.priority?.name ?? "Medium";
  const pc        = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];
  const overdue   = isOverdue(issue.fields.duedate);

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => openPanel(issue)}
      className={cn(
        "task-card relative group bg-navy-50/90 border border-white/8 rounded-xl p-3.5 cursor-pointer",
        "hover:border-brand-400/30 hover:bg-navy-50 hover:shadow-lg hover:shadow-black/20",
        "transition-all duration-150 select-none",
        isDragging && "dragging opacity-40 shadow-2xl scale-95"
      )}
    >
      {/* Priority bar */}
      <div className={cn("priority-bar rounded-l-xl", `bg-[${pc?.dot}]`)}
        style={{ background: pc?.dot }} />

      {/* Key badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono text-[10px] text-slate-500 font-medium">{issue.key}</span>
        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md", pc?.color, pc?.bg)}>
          {priority}
        </span>
      </div>

      {/* Summary */}
      <p className="text-sm text-slate-200 font-medium leading-snug line-clamp-2 mb-3 group-hover:text-white transition-colors">
        {issue.fields.summary}
      </p>

      {/* Labels */}
      {issue.fields.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {issue.fields.labels.slice(0, 2).map(label => (
            <span key={label} className="text-[10px] px-1.5 py-0.5 bg-teal-200/10 text-teal-200 rounded-md font-medium">
              {label}
            </span>
          ))}
          {issue.fields.labels.length > 2 && (
            <span className="text-[10px] text-slate-500">+{issue.fields.labels.length - 2}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-slate-500">
          {issue.fields.comment.total > 0 && (
            <span className="flex items-center gap-1 text-[11px]">
              <MessageSquare className="w-3 h-3" />
              {issue.fields.comment.total}
            </span>
          )}
          {issue.fields.attachment.length > 0 && (
            <span className="flex items-center gap-1 text-[11px]">
              <Paperclip className="w-3 h-3" />
              {issue.fields.attachment.length}
            </span>
          )}
          {issue.fields.duedate && (
            <span className={cn("flex items-center gap-1 text-[11px]", overdue ? "text-red-400" : "text-slate-500")}>
              <Calendar className="w-3 h-3" />
              {formatDate(issue.fields.duedate)}
            </span>
          )}
        </div>

        {/* Assignee avatar */}
        {issue.fields.assignee ? (
          issue.fields.assignee.avatarUrls?.["24x24"] ? (
            <img
              src={issue.fields.assignee.avatarUrls["24x24"]}
              alt={issue.fields.assignee.displayName}
              title={issue.fields.assignee.displayName}
              className="w-6 h-6 rounded-full border border-white/10"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-brand-400/20 text-brand-300 text-[9px] font-bold flex items-center justify-center border border-white/10"
              title={issue.fields.assignee.displayName}>
              {getInitials(issue.fields.assignee.displayName)}
            </div>
          )
        ) : (
          <div className="w-6 h-6 rounded-full border border-dashed border-slate-600 flex items-center justify-center" title="Unassigned">
            <span className="text-slate-600 text-[9px]">?</span>
          </div>
        )}
      </div>
    </div>
  );
}
