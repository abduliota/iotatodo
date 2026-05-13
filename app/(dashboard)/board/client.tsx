"use client";
import KanbanBoard from "@/components/board/KanbanBoard";
import TaskDetailPanel from "@/components/task/TaskDetailPanel";
import CreateTaskModal from "@/components/task/CreateTaskModal";
import { useAppStore } from "@/store/useAppStore";

export default function BoardPageClient() {
  const { createModalOpen, panelOpen } = useAppStore();
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <KanbanBoard />
      {panelOpen && <TaskDetailPanel />}
      {createModalOpen && <CreateTaskModal />}
    </div>
  );
}
