import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import type { PriorityName } from "@/types/jira";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return dateString;
  }
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  try {
    return format(parseISO(dateString), "MMM d, yyyy");
  } catch {
    return dateString;
  }
}

export function isOverdue(duedate: string | null): boolean {
  if (!duedate) return false;
  try {
    return parseISO(duedate) < new Date();
  } catch {
    return false;
  }
}

export const PRIORITY_CONFIG: Record<PriorityName, { color: string; bg: string; label: string; dot: string }> = {
  Highest: { color: "text-red-400",    bg: "bg-red-400/10",    label: "Highest", dot: "#FF4D4F" },
  High:    { color: "text-orange-400", bg: "bg-orange-400/10", label: "High",    dot: "#FF7A45" },
  Medium:  { color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Medium",  dot: "#FFC53D" },
  Low:     { color: "text-green-400",  bg: "bg-green-400/10",  label: "Low",     dot: "#73D13D" },
  Lowest:  { color: "text-blue-400",   bg: "bg-blue-400/10",   label: "Lowest",  dot: "#40A9FF" },
};

export const STATUS_COLUMNS = [
  { id: "todo",       name: "To Do",       color: "#64748B" },
  { id: "inprogress", name: "In Progress", color: "#1E6FD9" },
  { id: "inreview",   name: "In Review",   color: "#F59E0B" },
  { id: "done",       name: "Done",        color: "#10B981" },
];

// Map Jira status category key → our column id
export function statusToColumnId(statusName: string): string {
  const lower = statusName.toLowerCase().replace(/\s+/g, "");
  if (lower.includes("progress")) return "inprogress";
  if (lower.includes("review"))   return "inreview";
  if (lower.includes("done") || lower.includes("complete") || lower.includes("closed")) return "done";
  return "todo";
}

// ADF (Atlassian Document Format) → plain text
export function adfToText(adf: any): string {
  if (!adf) return "";
  if (typeof adf === "string") return adf;
  const extractText = (node: any): string => {
    if (node.type === "text") return node.text || "";
    if (node.content) return node.content.map(extractText).join("");
    return "";
  };
  return extractText(adf);
}

// Plain text → ADF
export function textToAdf(text: string): object {
  return {
    type: "doc",
    version: 1,
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
