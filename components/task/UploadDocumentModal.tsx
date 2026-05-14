"use client";
import { useState, useRef, useCallback } from "react";
import { X, Upload, FileText, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";

interface UploadedFile {
  file: File;
  status: "pending" | "creating" | "done" | "error";
  issueKey?: string;
  error?: string;
}

export default function UploadDocumentModal({ onClose }: { onClose: () => void }) {
  const { addIssueToStore } = useAppStore();
  const qc = useQueryClient();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getNameWithoutExt = (filename: string) => {
    return filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const newFiles: UploadedFile[] = Array.from(incoming).map(f => ({
      file: f,
      status: "pending",
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const createTasksForFiles = async () => {
    const pending = files.filter(f => f.status === "pending");
    if (!pending.length) return;

    for (const f of pending) {
      // Set to creating
      setFiles(prev => prev.map(x =>
        x.file.name === f.file.name ? { ...x, status: "creating" } : x
      ));

      try {
        const taskName = getNameWithoutExt(f.file.name);
        const res = await fetch("/api/jira/issues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: taskName,
            description: `Task created from uploaded document: ${f.file.name}`,
            priority: "Medium",
            assigneeId: null,
            duedate: null,
            labels: ["uploaded-doc"],
          }),
        });

        if (!res.ok) throw new Error("Failed to create task");
        const data = await res.json();

        addIssueToStore(data.issue);
        qc.invalidateQueries({ queryKey: ["jira-issues"] });

        setFiles(prev => prev.map(x =>
          x.file.name === f.file.name
            ? { ...x, status: "done", issueKey: data.issue.key }
            : x
        ));
      } catch (err: any) {
        setFiles(prev => prev.map(x =>
          x.file.name === f.file.name
            ? { ...x, status: "error", error: err.message }
            : x
        ));
      }
    }
  };

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.file.name !== name));
  };

  const allDone = files.length > 0 && files.every(f => f.status === "done" || f.status === "error");
  const hasCreating = files.some(f => f.status === "creating");
  const hasPending = files.some(f => f.status === "pending");

  const fileIconColor = (ext: string) => {
    const map: Record<string, string> = {
      pdf: "#FF4D4F", doc: "#1E6FD9", docx: "#1E6FD9",
      xls: "#10B981", xlsx: "#10B981", txt: "#64748B",
      ppt: "#F59E0B", pptx: "#F59E0B",
    };
    return map[ext] ?? "#64748B";
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }} />

      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 51, width: "100%", maxWidth: 500,
        background: "#162435", border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 20, boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        animation: "scaleIn 0.18s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <style>{`@keyframes scaleIn { from { transform: translate(-50%,-50%) scale(0.95); opacity:0; } to { transform: translate(-50%,-50%) scale(1); opacity:1; } }`}</style>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>Upload Document</h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#475569" }}>Creates a To Do task from each file's name</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 4, display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "#1E6FD9" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 14, padding: "32px 20px", textAlign: "center", cursor: "pointer",
              background: dragging ? "rgba(30,111,217,0.07)" : "rgba(255,255,255,0.02)",
              transition: "all 0.15s",
              marginBottom: files.length > 0 ? 16 : 0,
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(30,111,217,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Upload size={20} color="#1E6FD9" />
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
              {dragging ? "Drop files here" : "Click or drag files here"}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
              PDF, Word, Excel, PowerPoint, TXT — any file type
            </p>
            <input ref={inputRef} type="file" multiple onChange={e => addFiles(e.target.files)} style={{ display: "none" }} />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16, maxHeight: 240, overflowY: "auto" }}>
              {files.map(f => {
                const ext = f.file.name.split(".").pop()?.toLowerCase() ?? "";
                const taskName = getNameWithoutExt(f.file.name);
                const color = fileIconColor(ext);
                return (
                  <div key={f.file.name} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", borderRadius: 10,
                    background: f.status === "done" ? "rgba(16,185,129,0.07)" : f.status === "error" ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${f.status === "done" ? "rgba(16,185,129,0.2)" : f.status === "error" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)"}`,
                  }}>
                    {/* File icon */}
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileText size={16} color={color} />
                    </div>

                    {/* File info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {taskName}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 10, color: "#475569" }}>
                        {f.file.name} · {(f.file.size / 1024).toFixed(0)} KB
                      </p>
                      {f.status === "done" && f.issueKey && (
                        <p style={{ margin: "2px 0 0", fontSize: 10, color: "#10B981", fontWeight: 600 }}>
                          ✓ Created as {f.issueKey} in To Do
                        </p>
                      )}
                      {f.status === "error" && (
                        <p style={{ margin: "2px 0 0", fontSize: 10, color: "#f87171" }}>✗ Failed to create task</p>
                      )}
                    </div>

                    {/* Status icon */}
                    <div style={{ flexShrink: 0 }}>
                      {f.status === "pending" && (
                        <button onClick={(e) => { e.stopPropagation(); removeFile(f.file.name); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex", padding: 2 }}>
                          <X size={14} />
                        </button>
                      )}
                      {f.status === "creating" && <Loader2 size={16} color="#1E6FD9" style={{ animation: "spin 0.7s linear infinite" }} />}
                      {f.status === "done" && <CheckCircle size={16} color="#10B981" />}
                      {f.status === "error" && <AlertCircle size={16} color="#f87171" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer buttons */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={onClose}
              style={{ padding: "9px 18px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#64748b", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
              {allDone ? "Close" : "Cancel"}
            </button>

            {!allDone && (
              <button
                onClick={createTasksForFiles}
                disabled={!hasPending || hasCreating}
                style={{
                  padding: "9px 20px", borderRadius: 10, border: "none", cursor: hasPending && !hasCreating ? "pointer" : "not-allowed",
                  background: hasPending && !hasCreating ? "linear-gradient(135deg, #1E6FD9, #1558B0)" : "rgba(255,255,255,0.05)",
                  color: hasPending && !hasCreating ? "#fff" : "#475569",
                  fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 6,
                  boxShadow: hasPending && !hasCreating ? "0 4px 12px rgba(30,111,217,0.3)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {hasCreating && <Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} />}
                {hasCreating ? "Creating tasks…" : `Create ${files.filter(f => f.status === "pending").length} Task${files.filter(f => f.status === "pending").length !== 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}