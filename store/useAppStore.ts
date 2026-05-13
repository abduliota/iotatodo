import { create } from "zustand";
import type { JiraIssue, BoardColumn } from "@/types/jira";
import { STATUS_COLUMNS, statusToColumnId } from "@/lib/utils";

interface AppState {
  // Board
  columns:        BoardColumn[];
  selectedIssue:  JiraIssue | null;
  panelOpen:      boolean;
  createModalOpen: boolean;

  // Filters
  search:         string;
  filterAssignee: string | null;
  filterPriority: string | null;

  // UI
  darkMode: boolean;

  // Actions
  setIssues:         (issues: JiraIssue[]) => void;
  setSelectedIssue:  (issue: JiraIssue | null) => void;
  openPanel:         (issue: JiraIssue) => void;
  closePanel:        () => void;
  openCreateModal:   () => void;
  closeCreateModal:  () => void;
  moveIssue:         (issueId: string, fromCol: string, toCol: string) => void;
  updateIssueInStore:(issue: JiraIssue) => void;
  addIssueToStore:   (issue: JiraIssue) => void;
  removeIssueFromStore:(issueId: string) => void;
  setSearch:         (search: string) => void;
  setFilterAssignee: (id: string | null) => void;
  setFilterPriority: (p: string | null) => void;
  toggleDarkMode:    () => void;
  filteredColumns:   () => BoardColumn[];
}

export const useAppStore = create<AppState>((set, get) => ({
  columns:         STATUS_COLUMNS.map(c => ({ ...c, issues: [] })),
  selectedIssue:   null,
  panelOpen:       false,
  createModalOpen: false,
  search:          "",
  filterAssignee:  null,
  filterPriority:  null,
  darkMode:        true,

  setIssues: (issues) => {
    const cols: BoardColumn[] = STATUS_COLUMNS.map(c => ({ ...c, issues: [] }));
    issues.forEach(issue => {
      const colId = statusToColumnId(issue.fields.status.name);
      const col = cols.find(c => c.id === colId) ?? cols[0];
      col.issues.push(issue);
    });
    set({ columns: cols });
  },

  setSelectedIssue: (issue) => set({ selectedIssue: issue }),

  openPanel: (issue) => set({ selectedIssue: issue, panelOpen: true }),

  closePanel: () => set({ panelOpen: false, selectedIssue: null }),

  openCreateModal: () => set({ createModalOpen: true }),

  closeCreateModal: () => set({ createModalOpen: false }),

  moveIssue: (issueId, fromCol, toCol) => {
    set(state => {
      const cols = state.columns.map(c => ({ ...c, issues: [...c.issues] }));
      const from = cols.find(c => c.id === fromCol);
      const to   = cols.find(c => c.id === toCol);
      if (!from || !to) return state;

      const idx = from.issues.findIndex(i => i.id === issueId);
      if (idx === -1) return state;

      const [issue] = from.issues.splice(idx, 1);
      to.issues.unshift(issue);
      return { columns: cols };
    });
  },

  updateIssueInStore: (updated) => {
    set(state => ({
      columns: state.columns.map(col => ({
        ...col,
        issues: col.issues.map(i => (i.id === updated.id ? updated : i)),
      })),
      selectedIssue:
        state.selectedIssue?.id === updated.id ? updated : state.selectedIssue,
    }));
  },

  addIssueToStore: (issue) => {
    const colId = statusToColumnId(issue.fields.status.name);
    set(state => ({
      columns: state.columns.map(col =>
        col.id === colId
          ? { ...col, issues: [issue, ...col.issues] }
          : col
      ),
    }));
  },

  removeIssueFromStore: (issueId) => {
    set(state => ({
      columns: state.columns.map(col => ({
        ...col,
        issues: col.issues.filter(i => i.id !== issueId),
      })),
      panelOpen: state.selectedIssue?.id === issueId ? false : state.panelOpen,
      selectedIssue: state.selectedIssue?.id === issueId ? null : state.selectedIssue,
    }));
  },

  setSearch: (search) => set({ search }),
  setFilterAssignee: (filterAssignee) => set({ filterAssignee }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),
  toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),

  filteredColumns: () => {
    const { columns, search, filterAssignee, filterPriority } = get();
    return columns.map(col => ({
      ...col,
      issues: col.issues.filter(issue => {
        const matchSearch = !search ||
          issue.fields.summary.toLowerCase().includes(search.toLowerCase()) ||
          issue.key.toLowerCase().includes(search.toLowerCase());
        const matchAssignee = !filterAssignee ||
          issue.fields.assignee?.accountId === filterAssignee;
        const matchPriority = !filterPriority ||
          issue.fields.priority?.name === filterPriority;
        return matchSearch && matchAssignee && matchPriority;
      }),
    }));
  },
}));
