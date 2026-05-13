"use client";
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { statusToColumnId } from "@/lib/utils";
import type { JiraIssue, JiraTransition } from "@/types/jira";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "./TaskCard";

export default function KanbanBoard() {
  const qc = useQueryClient();
  const { setIssues, filteredColumns, moveIssue } = useAppStore();
  const [activeIssue, setActiveIssue] = useState<JiraIssue | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // ── Fetch issues ──────────────────────────────────────────────────────────
  const { isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["jira-issues"],
    queryFn: async () => {
      const res = await fetch("/api/jira/issues");
      const data = await res.json();
      setIssues(data.issues ?? []);
      return data.issues as JiraIssue[];
    },
    refetchInterval: 60_000, // poll every 60s
  });

  // ── Transition mutation ───────────────────────────────────────────────────
  const transitionMutation = useMutation({
    mutationFn: async ({ issueId, targetColId, allIssues }: {
      issueId: string; targetColId: string; allIssues: JiraIssue[];
    }) => {
      // Get available transitions for this issue
      const transRes = await fetch(`/api/jira/transitions?issueId=${issueId}`);
      const { transitions }: { transitions: JiraTransition[] } = await transRes.json();

      // Find matching transition
      const match = transitions.find(t =>
        statusToColumnId(t.to.name) === targetColId
      );

      if (!match) return; // no matching transition

      await fetch("/api/jira/transitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId, transitionId: match.id }),
      });
    },
    onError: () => {
      // Revert by refetching
      refetch();
    },
  });

  // ── DnD sensors ──────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findIssueById = useCallback((id: string): JiraIssue | undefined => {
    return filteredColumns()
      .flatMap(c => c.issues)
      .find(i => i.id === id);
  }, [filteredColumns]);

  const findColumnByIssueId = useCallback((issueId: string): string | null => {
    const col = filteredColumns().find(c => c.issues.some(i => i.id === issueId));
    return col?.id ?? null;
  }, [filteredColumns]);

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveIssue(findIssueById(active.id as string) ?? null);
  };

  const onDragOver = ({ over }: DragOverEvent) => {
    setOverId(over?.id as string ?? null);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveIssue(null);
    setOverId(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId   = over.id as string;
    if (activeId === overId) return;

    const fromCol = findColumnByIssueId(activeId);
    // over could be a column id or another card id
    const cols    = filteredColumns();
    const toCol   = cols.find(c => c.id === overId)?.id
      ?? cols.find(c => c.issues.some(i => i.id === overId))?.id;

    if (!fromCol || !toCol || fromCol === toCol) return;

    // Optimistic update
    moveIssue(activeId, fromCol, toCol);

    const allIssues = cols.flatMap(c => c.issues);
    transitionMutation.mutate({ issueId: activeId, targetColId: toCol, allIssues });
  };

  const cols = filteredColumns();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 gap-3 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
        <span className="text-sm">Loading tasks from Jira…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3">
        <p className="text-sm text-red-400">Failed to load issues from Jira.</p>
        <button onClick={() => refetch()} className="text-xs text-brand-400 hover:underline">Try again</button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto p-6">
      <div className="flex items-center justify-end mb-4 gap-2">
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Syncing…" : "Refresh"}
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-5 pb-6 min-w-max">
          {cols.map(col => (
            <KanbanColumn
              key={col.id}
              column={col}
              isOver={overId === col.id}
            />
          ))}
        </div>

        <DragOverlay>
          {activeIssue && (
            <div className="rotate-2 scale-105 opacity-95 shadow-2xl shadow-black/40">
              <TaskCard issue={activeIssue} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
