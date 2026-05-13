import Topbar from "@/components/layout/Topbar";
import KanbanBoard from "@/components/board/KanbanBoard";
import TaskDetailPanel from "@/components/task/TaskDetailPanel";
import CreateTaskModal from "@/components/task/CreateTaskModal";
import BoardPageClient from "./client";

export default function BoardPage() {
  return (
    <div className="flex flex-col h-screen">
      <Topbar title="Board" />
      <BoardPageClient />
    </div>
  );
}
