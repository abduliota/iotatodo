"use client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { BoardColumn } from "@/types/jira";
import TaskCard from "./TaskCard";
import { cn } from "@/lib/utils";

interface Props {
  column: BoardColumn;
  isOver?: boolean;
}

export default function KanbanColumn({ column, isOver }: Props) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col w-[300px] flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: column.color }} />
          <span className="text-sm font-semibold text-slate-300">{column.name}</span>
          <span className="text-xs font-mono text-slate-600 bg-white/5 border border-white/8 rounded-full px-2 py-0.5">
            {column.issues.length}
          </span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "kanban-col flex-1 rounded-2xl p-2 space-y-2.5 min-h-[200px] border border-transparent transition-all duration-150",
          isOver
            ? "border-brand-400/30 bg-brand-400/5 shadow-inner"
            : "border-white/0"
        )}
      >
        <SortableContext
          items={column.issues.map(i => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.issues.map(issue => (
            <TaskCard key={issue.id} issue={issue} />
          ))}
        </SortableContext>

        {column.issues.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-slate-600 border border-dashed border-white/6 rounded-xl">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
