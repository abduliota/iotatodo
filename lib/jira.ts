import type {
  JiraIssue, JiraUser, JiraTransition, JiraComment,
  CreateIssuePayload, UpdateIssuePayload, DashboardStats,
} from "@/types/jira";
import { textToAdf, statusToColumnId } from "@/lib/utils";
import { subWeeks, startOfWeek, endOfWeek, format } from "date-fns";

const PROJECT_KEY = process.env.NEXT_PUBLIC_JIRA_PROJECT_KEY ?? "IOTA";

// ── Base fetch wrapper ────────────────────────────────────────────────────────
async function jiraFetch(
  cloudId: string,
  accessToken: string,
  path: string,
  options: RequestInit = {}
) {
  const base = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3`;
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Jira API error ${res.status}: ${error}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function jiraAgileFetch(
  cloudId: string,
  accessToken: string,
  path: string,
  options: RequestInit = {}
) {
  const base = `https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0`;
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Jira Agile API ${res.status}: ${errText}`);
  }
  return res.json();
}

// ── Issues ────────────────────────────────────────────────────────────────────
export async function getIssues(
  cloudId: string,
  accessToken: string,
  jql?: string
): Promise<JiraIssue[]> {
  const query = jql ?? `project = ${PROJECT_KEY} AND sprint in openSprints() ORDER BY updated DESC`;
  const fields = [
    "summary", "status", "priority", "assignee", "reporter",
    "created", "updated", "duedate", "labels", "comment",
    "attachment", "subtasks", "timeestimate", "timespent",
  ].join(",");

  const data = await jiraFetch(
    cloudId, accessToken,
    `/search/jql?jql=${encodeURIComponent(query)}&fields=${fields}&maxResults=100&expand=changelog`
  );
  return data.issues ?? [];
}

export async function getIssue(
  cloudId: string,
  accessToken: string,
  issueId: string
): Promise<JiraIssue> {
  return jiraFetch(
    cloudId, accessToken,
    `/issue/${issueId}?expand=changelog,renderedFields`
  );
}

export async function createIssue(
  cloudId: string,
  accessToken: string,
  payload: CreateIssuePayload
): Promise<JiraIssue> {
  const body: any = {
    fields: {
      project:   { key: PROJECT_KEY },
      summary:   payload.summary,
      issuetype: { name: "Task" },
      priority:  { name: payload.priority },
      labels:    payload.labels,
    },
  };

  if (payload.description) {
    body.fields.description = textToAdf(payload.description);
  }
  if (payload.assigneeId) {
    body.fields.assignee = { id: payload.assigneeId };
  }
  if (payload.duedate) {
    body.fields.duedate = payload.duedate;
  }

  const created = await jiraFetch(cloudId, accessToken, "/issue", {
    method: "POST",
    body:   JSON.stringify(body),
  });

  // Add to active sprint so it shows on the board immediately
  await addToActiveSprint(cloudId, accessToken, created.key);

  // Return full issue
  return getIssue(cloudId, accessToken, created.id);
}

// ── Add issue to active sprint ────────────────────────────────────────────────
async function addToActiveSprint(
  cloudId: string,
  accessToken: string,
  issueKey: string
): Promise<void> {
  try {
    // Find active sprint via JQL — no agile API needed
    const sprintData = await jiraFetch(cloudId, accessToken,
      `/search/jql?jql=${encodeURIComponent(`project = ${PROJECT_KEY} AND sprint in openSprints()`)}&maxResults=1&fields=sprint`
    );

    // Get sprint ID from the first issue in the active sprint
    const firstIssue = sprintData?.issues?.[0];
    const sprintField = firstIssue?.fields?.sprint ?? Object.values(firstIssue?.fields ?? {}).find((v: any) => v?.sprintId);

    // Try agile API to get sprint ID
    const boardsRes = await jiraAgileFetch(cloudId, accessToken, `/board?projectKeyOrId=${PROJECT_KEY}&type=scrum`);
    console.log("[jira] boards:", JSON.stringify(boardsRes?.values?.map((b: any) => ({ id: b.id, name: b.name }))));
    const board = boardsRes?.values?.[0];
    if (!board) {
      console.log("[jira] No board found for project", PROJECT_KEY);
      return;
    }

    const sprintsRes = await jiraAgileFetch(cloudId, accessToken, `/board/${board.id}/sprint?state=active`);
    console.log("[jira] sprints:", JSON.stringify(sprintsRes?.values?.map((s: any) => ({ id: s.id, name: s.name }))));
    const sprint = sprintsRes?.values?.[0];
    if (!sprint) {
      console.log("[jira] No active sprint found");
      return;
    }

    await jiraAgileFetch(cloudId, accessToken, `/sprint/${sprint.id}/issue`, {
      method: "POST",
      body: JSON.stringify({ issues: [issueKey] }),
    });
    console.log(`[jira] Added ${issueKey} to sprint ${sprint.id} (${sprint.name})`);
  } catch (err) {
    console.error("[jira] addToActiveSprint failed (non-fatal):", err);
  }
}

export async function updateIssue(
  cloudId: string,
  accessToken: string,
  issueId: string,
  payload: UpdateIssuePayload
): Promise<void> {
  const fields: any = {};

  if (payload.summary   !== undefined) fields.summary   = payload.summary;
  if (payload.priority  !== undefined) fields.priority  = { name: payload.priority };
  if (payload.duedate   !== undefined) fields.duedate   = payload.duedate;
  if (payload.labels    !== undefined) fields.labels    = payload.labels;
  if (payload.assigneeId !== undefined)
    fields.assignee = payload.assigneeId ? { id: payload.assigneeId } : null;
  if (payload.description !== undefined)
    fields.description = textToAdf(payload.description);

  await jiraFetch(cloudId, accessToken, `/issue/${issueId}`, {
    method: "PUT",
    body:   JSON.stringify({ fields }),
  });
}

export async function deleteIssue(
  cloudId: string,
  accessToken: string,
  issueId: string
): Promise<void> {
  await jiraFetch(cloudId, accessToken, `/issue/${issueId}`, { method: "DELETE" });
}

// ── Transitions ───────────────────────────────────────────────────────────────
export async function getTransitions(
  cloudId: string,
  accessToken: string,
  issueId: string
): Promise<JiraTransition[]> {
  const data = await jiraFetch(cloudId, accessToken, `/issue/${issueId}/transitions`);
  return data.transitions ?? [];
}

export async function transitionIssue(
  cloudId: string,
  accessToken: string,
  issueId: string,
  transitionId: string
): Promise<void> {
  await jiraFetch(cloudId, accessToken, `/issue/${issueId}/transitions`, {
    method: "POST",
    body:   JSON.stringify({ transition: { id: transitionId } }),
  });
}

// ── Comments ──────────────────────────────────────────────────────────────────
export async function addComment(
  cloudId: string,
  accessToken: string,
  issueId: string,
  text: string
): Promise<JiraComment> {
  return jiraFetch(cloudId, accessToken, `/issue/${issueId}/comment`, {
    method: "POST",
    body:   JSON.stringify({ body: textToAdf(text) }),
  });
}

// ── Users ─────────────────────────────────────────────────────────────────────
export async function getAssignableUsers(
  cloudId: string,
  accessToken: string
): Promise<JiraUser[]> {
  return jiraFetch(
    cloudId, accessToken,
    `/user/assignable/search?project=${PROJECT_KEY}&maxResults=50`
  );
}

// ── Stats aggregation ─────────────────────────────────────────────────────────
export async function getDashboardStats(
  cloudId: string,
  accessToken: string
): Promise<DashboardStats> {
  const [openIssues, recentlyDone] = await Promise.all([
    getIssues(cloudId, accessToken,
      `project = ${PROJECT_KEY} AND resolution = Unresolved`),
    getIssues(cloudId, accessToken,
      `project = ${PROJECT_KEY} AND resolution != Unresolved AND updated >= -7d`),
  ]);

  const totalOpen      = openIssues.length;
  const inProgress     = openIssues.filter(i => statusToColumnId(i.fields.status.name) === "inprogress").length;
  const completedToday = recentlyDone.filter(i => {
    const u = new Date(i.fields.updated);
    const now = new Date();
    return u.toDateString() === now.toDateString();
  }).length;
  const blocked = openIssues.filter(i => {
    const u = new Date(i.fields.updated);
    return (Date.now() - u.getTime()) > 3 * 24 * 60 * 60 * 1000;
  }).length;

  // Status distribution
  const statusMap: Record<string, number> = {};
  openIssues.forEach(i => {
    const s = i.fields.status.name;
    statusMap[s] = (statusMap[s] ?? 0) + 1;
  });
  const statusColors: Record<string, string> = {
    "To Do": "#64748B", "In Progress": "#1E6FD9",
    "In Review": "#F59E0B", "Done": "#10B981",
  };
  const byStatus = Object.entries(statusMap).map(([name, value]) => ({
    name, value, color: statusColors[name] ?? "#64748B",
  }));

  // Priority distribution
  const priorityMap: Record<string, number> = {};
  openIssues.forEach(i => {
    const p = i.fields.priority?.name ?? "Medium";
    priorityMap[p] = (priorityMap[p] ?? 0) + 1;
  });
  const priorityColors: Record<string, string> = {
    Highest: "#FF4D4F", High: "#FF7A45",
    Medium: "#FFC53D",  Low: "#73D13D", Lowest: "#40A9FF",
  };
  const byPriority = Object.entries(priorityMap).map(([name, value]) => ({
    name: name as any, value, color: priorityColors[name] ?? "#64748B",
  }));

  // Assignee workload
  const workloadMap: Record<string, any> = {};
  openIssues.forEach(i => {
    if (!i.fields.assignee) return;
    const id = i.fields.assignee.accountId;
    if (!workloadMap[id]) {
      workloadMap[id] = {
        assignee: i.fields.assignee, total: 0, inProgress: 0, todo: 0, done: 0,
      };
    }
    workloadMap[id].total++;
    const col = statusToColumnId(i.fields.status.name);
    if (col === "inprogress") workloadMap[id].inProgress++;
    else if (col === "todo")  workloadMap[id].todo++;
  });
  const assigneeWorkload = Object.values(workloadMap).slice(0, 8);

  // Weekly velocity (last 8 weeks)
  const velocity = Array.from({ length: 8 }, (_, idx) => {
    const weekStart = startOfWeek(subWeeks(new Date(), 7 - idx));
    const weekEnd   = endOfWeek(weekStart);
    const label     = format(weekStart, "MMM d");

    const allIssues = [...openIssues, ...recentlyDone];
    const completed = allIssues.filter(i => {
      const u = new Date(i.fields.updated);
      return u >= weekStart && u <= weekEnd &&
        statusToColumnId(i.fields.status.name) === "done";
    }).length;
    const created = allIssues.filter(i => {
      const c = new Date(i.fields.created);
      return c >= weekStart && c <= weekEnd;
    }).length;

    return { week: label, completed, created };
  });

  return { totalOpen, inProgress, completedToday, blocked, velocity, byStatus, byPriority, assigneeWorkload };
}