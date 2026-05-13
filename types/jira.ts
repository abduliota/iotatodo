// ── Jira User ──────────────────────────────────────────────────────────────
export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress: string;
  avatarUrls: {
    "48x48": string;
    "32x32": string;
    "24x24": string;
    "16x16": string;
  };
  active: boolean;
}

// ── Priority ───────────────────────────────────────────────────────────────
export type PriorityName = "Highest" | "High" | "Medium" | "Low" | "Lowest";

export interface JiraPriority {
  id:      string;
  name:    PriorityName;
  iconUrl: string;
}

// ── Status ─────────────────────────────────────────────────────────────────
export interface JiraStatus {
  id:             string;
  name:           string;
  statusCategory: { key: string; colorName: string; name: string };
}

// ── Transition ─────────────────────────────────────────────────────────────
export interface JiraTransition {
  id:   string;
  name: string;
  to:   JiraStatus;
}

// ── Comment ────────────────────────────────────────────────────────────────
export interface JiraComment {
  id:      string;
  author:  JiraUser;
  body:    { type: string; content: any[] };
  created: string;
  updated: string;
}

// ── Attachment ─────────────────────────────────────────────────────────────
export interface JiraAttachment {
  id:        string;
  filename:  string;
  mimeType:  string;
  size:      number;
  content:   string;
  created:   string;
  author:    JiraUser;
}

// ── Changelog ─────────────────────────────────────────────────────────────
export interface JiraChangelogItem {
  field:      string;
  fromString: string | null;
  toString:   string | null;
}

export interface JiraChangelogEntry {
  id:      string;
  author:  JiraUser;
  created: string;
  items:   JiraChangelogItem[];
}

// ── Subtask ────────────────────────────────────────────────────────────────
export interface JiraSubtask {
  id:     string;
  key:    string;
  fields: { summary: string; status: JiraStatus; priority: JiraPriority };
}

// ── Issue (Task) ───────────────────────────────────────────────────────────
export interface JiraIssue {
  id:     string;
  key:    string;
  self:   string;
  fields: {
    summary:     string;
    description: any | null;   // Atlassian Document Format
    status:      JiraStatus;
    priority:    JiraPriority;
    assignee:    JiraUser | null;
    reporter:    JiraUser;
    created:     string;
    updated:     string;
    duedate:     string | null;
    labels:      string[];
    comment:     { comments: JiraComment[]; total: number };
    attachment:  JiraAttachment[];
    subtasks:    JiraSubtask[];
    timeestimate: number | null;
    timespent:   number | null;
    changelog?:  { histories: JiraChangelogEntry[] };
  };
}

// ── Board Column ───────────────────────────────────────────────────────────
export interface BoardColumn {
  id:     string;
  name:   string;
  color:  string;
  issues: JiraIssue[];
}

// ── Stats ──────────────────────────────────────────────────────────────────
export interface WeeklyVelocity {
  week:      string;
  completed: number;
  created:   number;
}

export interface AssigneeWorkload {
  assignee:    JiraUser;
  total:       number;
  inProgress:  number;
  todo:        number;
  done:        number;
}

export interface StatusDistribution {
  name:  string;
  value: number;
  color: string;
}

export interface PriorityDistribution {
  name:  PriorityName;
  value: number;
  color: string;
}

export interface DashboardStats {
  totalOpen:       number;
  inProgress:      number;
  completedToday:  number;
  blocked:         number;
  velocity:        WeeklyVelocity[];
  byStatus:        StatusDistribution[];
  byPriority:      PriorityDistribution[];
  assigneeWorkload: AssigneeWorkload[];
}

// ── Create / Update payloads ───────────────────────────────────────────────
export interface CreateIssuePayload {
  summary:     string;
  description: string;
  priority:    PriorityName;
  assigneeId:  string | null;
  duedate:     string | null;
  labels:      string[];
}

export interface UpdateIssuePayload {
  summary?:     string;
  description?: string;
  priority?:    PriorityName;
  assigneeId?:  string | null;
  duedate?:     string | null;
  labels?:      string[];
}

// ── NextAuth session extension ─────────────────────────────────────────────
export interface JiraSession {
  accessToken: string;
  cloudId:     string;
  user: {
    name:    string;
    email:   string;
    image:   string;
    accountId: string;
  };
}
